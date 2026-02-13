import type {
  Attachment,
  BatchEmailMessage,
  BatchEmailMessageResponse,
  BatchEmailParams,
  BatchEmailResponse,
  EmailAddress,
  EmailParams,
  EmailResponse,
  InlineTemplate,
  ProviderCapabilities,
  ProviderTemplate,
  TemplateEmailParams,
} from '../../../interfaces/email/beta';
import { Logging } from '@ajs/logging/beta';
import {
  sendEmail,
  sendBatchEmail,
  getDefaultSender,
  getEmailWhitelist,
  type ApiResponse,
  type BrevoAddress,
  type BrevoAttachment,
  type BrevoBatchBody,
  type BrevoEmailBody,
  type BrevoEmailResponse,
  type BrevoMessageVersion,
} from './client';

interface WhitelistResult {
  to: EmailAddress[];
  cc: EmailAddress[] | undefined;
  bcc: EmailAddress[] | undefined;
  isEmpty: boolean;
}

interface BatchPreparedMessage {
  batchId: string | undefined;
  index: number;
  params: EmailParams;
}

interface BatchProgress {
  responses: BatchEmailMessageResponse[];
  successful: number;
  failed: number;
}

interface BatchChunkResult extends BatchProgress {
  shouldStop: boolean;
}

interface BatchState extends BatchProgress {
  pending: BatchPreparedMessage[];
}

interface BatchScope {
  defaults: Partial<EmailParams> | undefined;
  sender: BrevoAddress;
}

const PROVIDER_NAME = 'brevo';
const BATCH_CHUNK_SIZE = 1000;
const HTTP_SUCCESS_MIN = 200;
const HTTP_SUCCESS_MAX = 299;
const MISSING_SENDER_CODE = 'MISSING_SENDER';
const MISSING_SENDER_MESSAGE = 'No sender address provided and no default sender configured';

const PROVIDER_CAPABILITIES: ProviderCapabilities = {
  name: PROVIDER_NAME,
  features: {
    batch: true,
    templates: true,
    scheduling: true,
    openTracking: true,
    clickTracking: true,
    inlineAttachments: true,
    tags: true,
    metadata: false,
    priority: false,
  },
};

function isHttpSuccess(status: number): boolean {
  return status >= HTTP_SUCCESS_MIN && status <= HTTP_SUCCESS_MAX;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createErrorResponse(code: string, message: string, retryable: boolean): EmailResponse {
  return {
    success: false,
    status: 'failed',
    error: { code, message, retryable },
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

function createSuccessResponse(messageId?: string): EmailResponse {
  return {
    success: true,
    status: 'queued',
    messageId,
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

function createBatchItemResponse(
  base: EmailResponse,
  batchId: string | undefined,
  index: number,
  recipient: string,
): BatchEmailMessageResponse {
  return { ...base, batchId, index, recipient };
}

function mapApiResponse(response: ApiResponse<BrevoEmailResponse>): EmailResponse {
  if (isHttpSuccess(response.status)) {
    return createSuccessResponse(response.data?.messageId);
  }

  const errorCode = response.data?.code ?? 'API_ERROR';
  const errorMessage = response.data?.message ?? `HTTP ${response.status}`;
  return createErrorResponse(errorCode, errorMessage, response.status >= 500);
}

function formatAddress(address: EmailAddress): BrevoAddress {
  return typeof address === 'string' ? { email: address } : { email: address.email, name: address.name };
}

function formatAddresses(addresses: EmailAddress | EmailAddress[] | undefined): BrevoAddress[] | undefined {
  if (!addresses) {
    return undefined;
  }

  if (Array.isArray(addresses)) {
    return addresses.map((address) => formatAddress(address));
  }

  return [formatAddress(addresses)];
}

function formatSingleAddress(addresses: EmailAddress | EmailAddress[] | undefined): BrevoAddress | undefined {
  const normalized = normalizeAddresses(addresses);
  const firstAddress = normalized[0];
  return firstAddress ? formatAddress(firstAddress) : undefined;
}

function normalizeAddresses(addresses: EmailAddress | EmailAddress[] | undefined): EmailAddress[] {
  if (!addresses) {
    return [];
  }

  return Array.isArray(addresses) ? addresses : [addresses];
}

function extractEmail(address: EmailAddress): string {
  return typeof address === 'string' ? address : address.email;
}

function getFirstRecipient(to: EmailAddress | EmailAddress[]): string {
  const recipients = normalizeAddresses(to);
  const firstRecipient = recipients[0];
  return firstRecipient ? extractEmail(firstRecipient) : '';
}

function filterWhitelistedAddresses(addresses: EmailAddress[], patterns: RegExp[]): EmailAddress[] {
  return addresses.filter((address) => {
    const email = extractEmail(address);
    const isAllowed = patterns.some((pattern) => pattern.test(email));

    if (!isAllowed) {
      Logging.Warn(`[brevo/email] Recipient "${email}" filtered by whitelist`);
    }

    return isAllowed;
  });
}

function filterOptionalWhitelistedAddresses(
  addresses: EmailAddress | EmailAddress[] | undefined,
  patterns: RegExp[],
): EmailAddress[] | undefined {
  const normalized = normalizeAddresses(addresses);
  if (normalized.length === 0) {
    return undefined;
  }

  const filtered = filterWhitelistedAddresses(normalized, patterns);
  return filtered.length > 0 ? filtered : undefined;
}

function applyWhitelist(params: Pick<EmailParams, 'to' | 'cc' | 'bcc'>): WhitelistResult {
  const whitelist = getEmailWhitelist();
  const normalizedTo = normalizeAddresses(params.to);

  if (!whitelist || whitelist.length === 0) {
    const cc = normalizeAddresses(params.cc);
    const bcc = normalizeAddresses(params.bcc);

    return {
      to: normalizedTo,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      isEmpty: normalizedTo.length === 0,
    };
  }

  const patterns = whitelist.map((entry) => new RegExp(entry));
  const to = filterWhitelistedAddresses(normalizedTo, patterns);
  const cc = filterOptionalWhitelistedAddresses(params.cc, patterns);
  const bcc = filterOptionalWhitelistedAddresses(params.bcc, patterns);

  return { to, cc, bcc, isEmpty: to.length === 0 };
}

function applyFilteredRecipientsToEmailParams(params: EmailParams, filtered: WhitelistResult): EmailParams {
  const nextParams: EmailParams = { ...params, to: filtered.to };

  delete nextParams.cc;
  delete nextParams.bcc;

  if (filtered.cc) {
    nextParams.cc = filtered.cc;
  }

  if (filtered.bcc) {
    nextParams.bcc = filtered.bcc;
  }

  return nextParams;
}

function mapAttachmentContent(attachment: Attachment): string | undefined {
  if (!('content' in attachment)) {
    return undefined;
  }

  if (attachment.content instanceof Buffer) {
    return attachment.content.toString('base64');
  }

  if ('encoding' in attachment && attachment.encoding === 'base64') {
    return attachment.content;
  }

  return undefined;
}

function mapAttachment(attachment: Attachment): BrevoAttachment | null {
  if ('path' in attachment) {
    Logging.Error(`[brevo/email] PathAttachment not supported, "${attachment.filename}" ignored`);
    return null;
  }

  if ('url' in attachment) {
    return { name: attachment.filename, url: attachment.url };
  }

  const content = mapAttachmentContent(attachment);
  if (!content) {
    return null;
  }

  return { name: attachment.filename, content };
}

function mapAttachments(attachments: Attachment[] | undefined): BrevoAttachment[] | undefined {
  if (!attachments || attachments.length === 0) {
    return undefined;
  }

  const mapped = attachments
    .map((attachment) => mapAttachment(attachment))
    .filter((attachment): attachment is BrevoAttachment => attachment !== null);

  return mapped.length > 0 ? mapped : undefined;
}

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function renderTemplate(template: InlineTemplate, variables: Record<string, unknown>): string {
  return Object.entries(variables).reduce((content, [key, value]) => {
    const tokenPattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    return content.replace(tokenPattern, stringifyTemplateValue(value));
  }, template.content);
}

function isProviderTemplate(template: ProviderTemplate | InlineTemplate): template is ProviderTemplate {
  return 'id' in template;
}

function formatScheduledAt(schedule: EmailParams['schedule']): string | undefined {
  if (!schedule?.sendAt) {
    return undefined;
  }

  return schedule.sendAt instanceof Date ? schedule.sendAt.toISOString() : schedule.sendAt;
}

function resolveSender(from: EmailAddress | undefined): BrevoAddress | undefined {
  if (from) {
    return formatAddress(from);
  }

  return getDefaultSender();
}

function createMissingSenderResponse(): EmailResponse {
  return createErrorResponse(MISSING_SENDER_CODE, MISSING_SENDER_MESSAGE, false);
}

function buildEmailBody(params: EmailParams, sender: BrevoAddress): BrevoEmailBody {
  const body: BrevoEmailBody = {
    sender,
    to: formatAddresses(params.to) ?? [],
    subject: params.subject,
  };

  const cc = formatAddresses(params.cc);
  const bcc = formatAddresses(params.bcc);
  const replyTo = formatSingleAddress(params.replyTo);
  const attachments = mapAttachments(params.attachments);
  const scheduledAt = formatScheduledAt(params.schedule);

  if (params.html) body.htmlContent = params.html;
  if (params.text) body.textContent = params.text;
  if (cc) body.cc = cc;
  if (bcc) body.bcc = bcc;
  if (replyTo) body.replyTo = replyTo;
  if (attachments) body.attachment = attachments;
  if (params.tags) body.tags = params.tags;
  if (scheduledAt) body.scheduledAt = scheduledAt;

  return body;
}

function buildMessageVersion(params: EmailParams): BrevoMessageVersion {
  const version: BrevoMessageVersion = {
    to: formatAddresses(params.to) ?? [],
  };

  const cc = formatAddresses(params.cc);
  const bcc = formatAddresses(params.bcc);
  const replyTo = formatSingleAddress(params.replyTo);
  const attachments = mapAttachments(params.attachments);

  if (params.subject) version.subject = params.subject;
  if (params.html) version.htmlContent = params.html;
  if (params.text) version.textContent = params.text;
  if (cc) version.cc = cc;
  if (bcc) version.bcc = bcc;
  if (replyTo) version.replyTo = replyTo;
  if (attachments) version.attachment = attachments;

  return version;
}

function buildBatchMissingSenderResponse(params: BatchEmailParams): BatchEmailResponse {
  const responses = params.messages.map((message, index) =>
    createBatchItemResponse(createMissingSenderResponse(), message.batchId, index, getFirstRecipient(message.to)),
  );

  return {
    success: false,
    total: params.messages.length,
    successful: 0,
    failed: responses.length,
    responses,
  };
}

function mergeBatchMessage(defaults: Partial<EmailParams> | undefined, message: BatchEmailMessage): EmailParams {
  return { ...defaults, ...message };
}

function createInitialBatchState(params: BatchEmailParams): BatchState {
  const state: BatchState = {
    pending: [],
    responses: [],
    successful: 0,
    failed: 0,
  };

  params.messages.forEach((message, index) => {
    const merged = mergeBatchMessage(params.defaults, message);
    const filtered = applyWhitelist(merged);

    if (filtered.isEmpty) {
      Logging.Warn('[brevo/email] All recipients filtered by whitelist, skipping batch message');
      state.responses.push(createBatchItemResponse(createSuccessResponse(), message.batchId, index, getFirstRecipient(merged.to)));
      state.successful += 1;
      return;
    }

    state.pending.push({
      batchId: message.batchId,
      index,
      params: applyFilteredRecipientsToEmailParams(merged, filtered),
    });
  });

  return state;
}

function splitIntoChunks<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function buildBatchBody(chunk: BatchPreparedMessage[], scope: BatchScope): BrevoBatchBody {
  const firstParams = chunk[0]?.params;
  const body: BrevoBatchBody = {
    sender: scope.sender,
    messageVersions: chunk.map((entry) => buildMessageVersion(entry.params)),
  };

  const subject = scope.defaults?.subject ?? firstParams?.subject;
  const htmlContent = scope.defaults?.html ?? firstParams?.html;
  const textContent = scope.defaults?.text ?? firstParams?.text;
  const scheduledAt = formatScheduledAt(scope.defaults?.schedule);

  if (subject) body.subject = subject;
  if (htmlContent) body.htmlContent = htmlContent;
  if (textContent) body.textContent = textContent;
  if (scope.defaults?.tags) body.tags = scope.defaults.tags;
  if (scheduledAt) body.scheduledAt = scheduledAt;

  return body;
}

function buildChunkSuccessProgress(chunk: BatchPreparedMessage[], messageIds: string[]): BatchProgress {
  const responses = chunk.map((entry, index) =>
    createBatchItemResponse(createSuccessResponse(messageIds[index]), entry.batchId, entry.index, getFirstRecipient(entry.params.to)),
  );

  return {
    responses,
    successful: responses.length,
    failed: 0,
  };
}

function buildChunkFailureProgress(chunk: BatchPreparedMessage[], error: EmailResponse): BatchProgress {
  const responses = chunk.map((entry) =>
    createBatchItemResponse(error, entry.batchId, entry.index, getFirstRecipient(entry.params.to)),
  );

  return {
    responses,
    successful: 0,
    failed: responses.length,
  };
}

async function executeBatchChunk(
  chunk: BatchPreparedMessage[],
  body: BrevoBatchBody,
  continueOnError: boolean,
): Promise<BatchChunkResult> {
  try {
    const response = await sendBatchEmail(body);

    if (isHttpSuccess(response.status)) {
      const messageIds = response.data?.messageIds ?? [];
      return { ...buildChunkSuccessProgress(chunk, messageIds), shouldStop: false };
    }

    const errorCode = response.data?.code ?? 'API_ERROR';
    const errorMessage = response.data?.message ?? `HTTP ${response.status}`;
    const error = createErrorResponse(errorCode, errorMessage, response.status >= 500);
    return { ...buildChunkFailureProgress(chunk, error), shouldStop: !continueOnError };
  } catch (error) {
    const batchError = createErrorResponse('BATCH_SEND_FAILED', getErrorMessage(error), true);
    return { ...buildChunkFailureProgress(chunk, batchError), shouldStop: !continueOnError };
  }
}

function appendBatchProgress(target: BatchProgress, source: BatchProgress): void {
  target.responses.push(...source.responses);
  target.successful += source.successful;
  target.failed += source.failed;
}

function createBatchResponse(total: number, progress: BatchProgress): BatchEmailResponse {
  return {
    success: progress.failed === 0,
    total,
    successful: progress.successful,
    failed: progress.failed,
    responses: progress.responses,
  };
}

function buildInlineTemplateEmailParams(params: TemplateEmailParams, renderedContent: string): EmailParams {
  const emailParams: EmailParams = {
    to: params.to,
    subject: params.subject ?? '',
    from: params.from,
    replyTo: params.replyTo,
    cc: params.cc,
    bcc: params.bcc,
    attachments: params.attachments,
    priority: params.priority,
    tags: params.tags,
    metadata: params.metadata,
    schedule: params.schedule,
    providerOptions: params.providerOptions,
  };

  if (params.template.type === 'html') {
    emailParams.html = renderedContent;
  } else {
    emailParams.text = renderedContent;
  }

  return emailParams;
}

function parseTemplateId(templateId: string): number | null {
  const parsedTemplateId = Number.parseInt(templateId, 10);
  return Number.isNaN(parsedTemplateId) ? null : parsedTemplateId;
}

function buildTemplateBody(
  params: TemplateEmailParams,
  sender: BrevoAddress,
  templateId: number,
  filtered: WhitelistResult,
): BrevoEmailBody {
  const body: BrevoEmailBody = {
    sender,
    to: formatAddresses(filtered.to) ?? [],
    subject: params.subject ?? '',
    templateId,
  };

  const cc = formatAddresses(filtered.cc);
  const bcc = formatAddresses(filtered.bcc);
  const replyTo = formatSingleAddress(params.replyTo);
  const attachments = mapAttachments(params.attachments);
  const scheduledAt = formatScheduledAt(params.schedule);

  if (params.variables) body.params = params.variables;
  if (cc) body.cc = cc;
  if (bcc) body.bcc = bcc;
  if (replyTo) body.replyTo = replyTo;
  if (attachments) body.attachment = attachments;
  if (params.tags) body.tags = params.tags;
  if (scheduledAt) body.scheduledAt = scheduledAt;

  return body;
}

async function sendInlineTemplate(params: TemplateEmailParams): Promise<EmailResponse> {
  if (isProviderTemplate(params.template)) {
    return createErrorResponse('INVALID_TEMPLATE', 'Expected inline template', false);
  }

  const rendered = renderTemplate(params.template, params.variables ?? {});
  return Send(buildInlineTemplateEmailParams(params, rendered));
}

async function sendProviderTemplate(params: TemplateEmailParams): Promise<EmailResponse> {
  if (!isProviderTemplate(params.template)) {
    return createErrorResponse('INVALID_TEMPLATE', 'Expected provider template', false);
  }

  const sender = resolveSender(params.from);
  if (!sender) {
    return createMissingSenderResponse();
  }

  const templateId = parseTemplateId(params.template.id);
  if (templateId === null) {
    return createErrorResponse('INVALID_TEMPLATE_ID', `Template ID must be a valid number, got: ${params.template.id}`, false);
  }

  const filtered = applyWhitelist(params);
  if (filtered.isEmpty) {
    Logging.Warn('[brevo/email] All recipients filtered by whitelist, skipping template send');
    return createSuccessResponse();
  }

  const response = await sendEmail(buildTemplateBody(params, sender, templateId, filtered));
  return mapApiResponse(response);
}

export async function Send(params: EmailParams): Promise<EmailResponse> {
  try {
    const sender = resolveSender(params.from);

    if (!sender) {
      return createMissingSenderResponse();
    }

    const filtered = applyWhitelist(params);
    if (filtered.isEmpty) {
      Logging.Warn('[brevo/email] All recipients filtered by whitelist, skipping send');
      return createSuccessResponse();
    }

    const response = await sendEmail(buildEmailBody(applyFilteredRecipientsToEmailParams(params, filtered), sender));
    return mapApiResponse(response);
  } catch (error) {
    return createErrorResponse('SEND_FAILED', getErrorMessage(error), true);
  }
}

export async function SendBatch(params: BatchEmailParams): Promise<BatchEmailResponse> {
  const sender = resolveSender(params.defaults?.from);
  if (!sender) {
    return buildBatchMissingSenderResponse(params);
  }

  const state = createInitialBatchState(params);
  if (state.pending.length === 0) {
    return createBatchResponse(params.messages.length, state);
  }

  const continueOnError = params.continueOnError ?? true;
  const scope: BatchScope = { defaults: params.defaults, sender };
  const chunks = splitIntoChunks(state.pending, BATCH_CHUNK_SIZE);

  for (const chunk of chunks) {
    const chunkResult = await executeBatchChunk(chunk, buildBatchBody(chunk, scope), continueOnError);
    appendBatchProgress(state, chunkResult);
    if (chunkResult.shouldStop) {
      break;
    }
  }

  return createBatchResponse(params.messages.length, state);
}

export async function SendTemplate(params: TemplateEmailParams): Promise<EmailResponse> {
  try {
    if (!isProviderTemplate(params.template)) {
      return sendInlineTemplate(params);
    }

    return sendProviderTemplate(params);
  } catch (error) {
    return createErrorResponse('SEND_TEMPLATE_FAILED', getErrorMessage(error), true);
  }
}

export function GetCapabilities(): Promise<ProviderCapabilities> {
  return Promise.resolve(PROVIDER_CAPABILITIES);
}
