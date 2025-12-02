import type {
  Attachment,
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
  type BrevoAddress,
  type BrevoAttachment,
  type BrevoEmailBody,
  type BrevoBatchBody,
  type BrevoMessageVersion,
  type ApiResponse,
} from './client';

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

function errorResponse(code: string, message: string, retryable: boolean): EmailResponse {
  return {
    success: false,
    status: 'failed',
    error: { code, message, retryable },
    timestamp: new Date(),
    provider: 'brevo',
  };
}

function successResponse(messageId?: string): EmailResponse {
  return {
    success: true,
    status: 'queued',
    messageId,
    timestamp: new Date(),
    provider: 'brevo',
  };
}

function batchItemResponse(
  base: EmailResponse,
  batchId: string | undefined,
  index: number,
  recipient: string,
): BatchEmailMessageResponse {
  return { ...base, batchId, index, recipient };
}

function mapApiResponse(response: ApiResponse<{ messageId?: string; code?: string; message?: string }>): EmailResponse {
  if (response.status >= 200 && response.status < 300) {
    return successResponse(response.data?.messageId);
  }
  return errorResponse(
    response.data?.code || 'API_ERROR',
    response.data?.message || `HTTP ${response.status}`,
    response.status >= 500,
  );
}

// =============================================================================
// ADDRESS HELPERS
// =============================================================================

function formatAddress(addr: EmailAddress): BrevoAddress {
  return typeof addr === 'string' ? { email: addr } : { email: addr.email, name: addr.name };
}

function formatAddresses(addrs: EmailAddress | EmailAddress[] | undefined): BrevoAddress[] | undefined {
  if (!addrs) return undefined;
  return Array.isArray(addrs) ? addrs.map(formatAddress) : [formatAddress(addrs)];
}

function formatSingleAddress(addr: EmailAddress | EmailAddress[] | undefined): BrevoAddress | undefined {
  if (!addr) return undefined;
  if (Array.isArray(addr)) return addr.length > 0 ? formatAddress(addr[0]) : undefined;
  return formatAddress(addr);
}

function getFirstRecipient(to: EmailAddress | EmailAddress[]): string {
  const first = Array.isArray(to) ? to[0] : to;
  return typeof first === 'string' ? first : first.email;
}

// =============================================================================
// ATTACHMENT HELPERS
// =============================================================================

function mapAttachment(att: Attachment): BrevoAttachment | null {
  if ('path' in att) {
    Logging.Error(`[brevo/email] PathAttachment not supported, "${att.filename}" ignored`);
    return null;
  }

  if ('url' in att) {
    return { name: att.filename, url: att.url };
  }

  if ('content' in att) {
    let base64Content: string;
    if (att.content instanceof Buffer) {
      base64Content = att.content.toString('base64');
    } else if ('encoding' in att && att.encoding === 'base64') {
      base64Content = att.content;
    } else {
      return null;
    }
    return { name: att.filename, content: base64Content };
  }

  return null;
}

function mapAttachments(attachments: Attachment[] | undefined): BrevoAttachment[] | undefined {
  if (!attachments?.length) return undefined;
  const mapped = attachments.map(mapAttachment).filter((a): a is BrevoAttachment => a !== null);
  return mapped.length > 0 ? mapped : undefined;
}

// =============================================================================
// TEMPLATE HELPERS
// =============================================================================

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value as string | number | boolean);
}

function renderTemplate(template: InlineTemplate, variables: Record<string, unknown>): string {
  let content = template.content;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), stringifyValue(value));
  }
  return content;
}

function isProviderTemplate(template: ProviderTemplate | InlineTemplate): template is ProviderTemplate {
  return 'id' in template;
}

// =============================================================================
// SCHEDULE HELPERS
// =============================================================================

function formatScheduledAt(schedule: EmailParams['schedule']): string | undefined {
  if (!schedule?.sendAt) return undefined;
  return schedule.sendAt instanceof Date ? schedule.sendAt.toISOString() : schedule.sendAt;
}

// =============================================================================
// BODY BUILDERS
// =============================================================================

function buildEmailBody(params: EmailParams, sender: BrevoAddress): BrevoEmailBody {
  return {
    sender,
    to: formatAddresses(params.to) || [],
    subject: params.subject,
    ...(params.html && { htmlContent: params.html }),
    ...(params.text && { textContent: params.text }),
    ...(params.cc && { cc: formatAddresses(params.cc) }),
    ...(params.bcc && { bcc: formatAddresses(params.bcc) }),
    ...(params.replyTo && { replyTo: formatSingleAddress(params.replyTo) }),
    ...(params.attachments && { attachment: mapAttachments(params.attachments) }),
    ...(params.tags && { tags: params.tags }),
    ...(params.schedule?.sendAt && { scheduledAt: formatScheduledAt(params.schedule) }),
  };
}

function buildMessageVersion(params: EmailParams): BrevoMessageVersion {
  return {
    to: formatAddresses(params.to) || [],
    ...(params.subject && { subject: params.subject }),
    ...(params.html && { htmlContent: params.html }),
    ...(params.text && { textContent: params.text }),
    ...(params.cc && { cc: formatAddresses(params.cc) }),
    ...(params.bcc && { bcc: formatAddresses(params.bcc) }),
    ...(params.replyTo && { replyTo: formatSingleAddress(params.replyTo) }),
    ...(params.attachments && { attachment: mapAttachments(params.attachments) }),
  };
}

// =============================================================================
// INTERFACE FUNCTIONS
// =============================================================================

export async function Send(params: EmailParams): Promise<EmailResponse> {
  try {
    const defaultSender = getDefaultSender();
    const sender = params.from ? formatAddress(params.from) : defaultSender;

    if (!sender) {
      return errorResponse('MISSING_SENDER', 'No sender address provided and no default sender configured', false);
    }

    const response = await sendEmail(buildEmailBody(params, sender));
    return mapApiResponse(response);
  } catch (err) {
    return errorResponse('SEND_FAILED', (err as Error).message, true);
  }
}

const BATCH_CHUNK_SIZE = 1000;

export async function SendBatch(params: BatchEmailParams): Promise<BatchEmailResponse> {
  const responses: BatchEmailMessageResponse[] = [];
  let successful = 0;
  let failed = 0;
  const continueOnError = params.continueOnError ?? true;

  const defaultSender = getDefaultSender();
  const sender = params.defaults?.from ? formatAddress(params.defaults.from) : defaultSender;

  // No sender available - fail all messages
  if (!sender) {
    for (let i = 0; i < params.messages.length; i++) {
      const message = params.messages[i];
      const mergedParams: EmailParams = { ...params.defaults, ...message };
      responses.push(
        batchItemResponse(
          errorResponse('MISSING_SENDER', 'No sender address provided and no default sender configured', false),
          message.batchId,
          i,
          getFirstRecipient(mergedParams.to),
        ),
      );
      failed++;
    }
    return { success: false, total: params.messages.length, successful: 0, failed, responses };
  }

  // Split into chunks
  const chunks: (typeof params.messages)[] = [];
  for (let i = 0; i < params.messages.length; i += BATCH_CHUNK_SIZE) {
    chunks.push(params.messages.slice(i, i + BATCH_CHUNK_SIZE));
  }

  let globalIndex = 0;

  for (const chunk of chunks) {
    const messageVersions = chunk.map((message) => buildMessageVersion({ ...params.defaults, ...message }));

    // Brevo requires root-level subject and content, fallback to first message's values
    const batchSubject = params.defaults?.subject || chunk[0]?.subject;
    const batchHtml = params.defaults?.html || chunk[0]?.html;
    const batchText = params.defaults?.text || chunk[0]?.text;

    const batchBody: BrevoBatchBody = {
      sender,
      messageVersions,
      ...(batchSubject && { subject: batchSubject }),
      ...(batchHtml && { htmlContent: batchHtml }),
      ...(batchText && { textContent: batchText }),
      ...(params.defaults?.tags && { tags: params.defaults.tags }),
      ...(params.defaults?.schedule?.sendAt && { scheduledAt: formatScheduledAt(params.defaults.schedule) }),
    };

    try {
      const response = await sendBatchEmail(batchBody);

      if (response.status >= 200 && response.status < 300) {
        const messageIds = response.data?.messageIds || [];
        for (let i = 0; i < chunk.length; i++) {
          const message = chunk[i];
          const mergedParams: EmailParams = { ...params.defaults, ...message };
          responses.push(
            batchItemResponse(
              successResponse(messageIds[i]),
              message.batchId,
              globalIndex + i,
              getFirstRecipient(mergedParams.to),
            ),
          );
          successful++;
        }
      } else {
        // Chunk failed
        const baseError = errorResponse(
          response.data?.code || 'API_ERROR',
          response.data?.message || `HTTP ${response.status}`,
          response.status >= 500,
        );
        for (let i = 0; i < chunk.length; i++) {
          const message = chunk[i];
          const mergedParams: EmailParams = { ...params.defaults, ...message };
          responses.push(
            batchItemResponse(baseError, message.batchId, globalIndex + i, getFirstRecipient(mergedParams.to)),
          );
          failed++;
        }
        if (!continueOnError) break;
      }
    } catch (err) {
      // Exception - chunk failed
      const baseError = errorResponse('BATCH_SEND_FAILED', (err as Error).message, true);
      for (let i = 0; i < chunk.length; i++) {
        const message = chunk[i];
        const mergedParams: EmailParams = { ...params.defaults, ...message };
        responses.push(
          batchItemResponse(baseError, message.batchId, globalIndex + i, getFirstRecipient(mergedParams.to)),
        );
        failed++;
      }
      if (!continueOnError) break;
    }

    globalIndex += chunk.length;
  }

  return { success: failed === 0, total: params.messages.length, successful, failed, responses };
}

export async function SendTemplate(params: TemplateEmailParams): Promise<EmailResponse> {
  try {
    // Inline template: render locally
    if (!isProviderTemplate(params.template)) {
      const rendered = renderTemplate(params.template, params.variables ?? {});
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
        schedule: params.schedule,
        ...(params.template.type === 'html' ? { html: rendered } : { text: rendered }),
      };
      return Send(emailParams);
    }

    // Provider template
    const defaultSender = getDefaultSender();
    const sender = params.from ? formatAddress(params.from) : defaultSender;

    const templateId = parseInt(params.template.id, 10);
    if (isNaN(templateId)) {
      return errorResponse(
        'INVALID_TEMPLATE_ID',
        `Template ID must be a valid number, got: ${params.template.id}`,
        false,
      );
    }

    const body: BrevoEmailBody = {
      sender,
      to: formatAddresses(params.to) || [],
      subject: params.subject ?? '',
      templateId,
      params: params.variables as Record<string, unknown>,
      ...(params.cc && { cc: formatAddresses(params.cc) }),
      ...(params.bcc && { bcc: formatAddresses(params.bcc) }),
      ...(params.replyTo && { replyTo: formatSingleAddress(params.replyTo) }),
      ...(params.attachments && { attachment: mapAttachments(params.attachments) }),
      ...(params.tags && { tags: params.tags }),
      ...(params.schedule?.sendAt && { scheduledAt: formatScheduledAt(params.schedule) }),
    };

    const response = await sendEmail(body);
    return mapApiResponse(response);
  } catch (err) {
    return errorResponse('SEND_TEMPLATE_FAILED', (err as Error).message, true);
  }
}

export function GetCapabilities(): Promise<ProviderCapabilities> {
  return Promise.resolve({
    name: 'brevo',
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
  });
}
