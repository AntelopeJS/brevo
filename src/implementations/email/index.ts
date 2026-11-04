import { Logging } from "@antelopejs/interface-core/logging";
import type {
  BatchEmailParams,
  BatchEmailResponse,
  EmailParams,
  EmailResponse,
  ProviderCapabilities,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

import { sendEmail } from "./client";
import {
  PROVIDER_NAME,
  createErrorResponse,
  createMissingSenderResponse,
  createSuccessResponse,
  mapApiResponse,
} from "./responses";
import {
  applyFilteredRecipientsToEmailParams,
  applyWhitelist,
  resolveSender,
} from "./recipients";
import { buildEmailBody, buildTemplateBody } from "./message";
import {
  buildInlineTemplateEmailParams,
  isProviderTemplate,
  parseTemplateId,
  renderTemplate,
} from "./template";
import {
  BATCH_CHUNK_SIZE,
  type BatchScope,
  appendBatchProgress,
  buildBatchBody,
  buildBatchMissingSenderResponse,
  createBatchResponse,
  createInitialBatchState,
  executeBatchChunk,
  splitIntoChunks,
} from "./batch";

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

async function sendInlineTemplate(
  params: TemplateEmailParams,
): Promise<EmailResponse> {
  if (isProviderTemplate(params.template)) {
    return createErrorResponse(
      "INVALID_TEMPLATE",
      "Expected inline template",
      false,
    );
  }

  const rendered = renderTemplate(params.template, params.variables ?? {});
  return Send(
    buildInlineTemplateEmailParams(params, params.template, rendered),
  );
}

async function sendProviderTemplate(
  params: TemplateEmailParams,
): Promise<EmailResponse> {
  if (!isProviderTemplate(params.template)) {
    return createErrorResponse(
      "INVALID_TEMPLATE",
      "Expected provider template",
      false,
    );
  }

  const sender = resolveSender(params.from);
  if (!sender) {
    return createMissingSenderResponse();
  }

  const templateId = parseTemplateId(params.template.id);
  if (templateId === null) {
    return createErrorResponse(
      "INVALID_TEMPLATE_ID",
      `Template ID must be a valid number, got: ${params.template.id}`,
      false,
    );
  }

  const filtered = applyWhitelist(params);
  if (filtered.isEmpty) {
    Logging.Warn(
      "[brevo/email] All recipients filtered by whitelist, skipping template send",
    );
    return createSuccessResponse();
  }

  const response = await sendEmail(
    buildTemplateBody(params, sender, templateId, filtered),
  );
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
      Logging.Warn(
        "[brevo/email] All recipients filtered by whitelist, skipping send",
      );
      return createSuccessResponse();
    }

    const response = await sendEmail(
      buildEmailBody(
        applyFilteredRecipientsToEmailParams(params, filtered),
        sender,
      ),
    );
    return mapApiResponse(response);
  } catch (error) {
    return createErrorResponse(
      "SEND_FAILED",
      error instanceof Error ? error.message : String(error),
      true,
    );
  }
}

export async function SendBatch(
  params: BatchEmailParams,
): Promise<BatchEmailResponse> {
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
    const chunkResult = await executeBatchChunk(
      chunk,
      buildBatchBody(chunk, scope),
      continueOnError,
    );
    appendBatchProgress(state, chunkResult);
    if (chunkResult.shouldStop) {
      break;
    }
  }

  return createBatchResponse(params.messages.length, state);
}

export async function SendTemplate(
  params: TemplateEmailParams,
): Promise<EmailResponse> {
  try {
    if (!isProviderTemplate(params.template)) {
      return sendInlineTemplate(params);
    }

    return sendProviderTemplate(params);
  } catch (error) {
    return createErrorResponse(
      "SEND_TEMPLATE_FAILED",
      error instanceof Error ? error.message : String(error),
      true,
    );
  }
}

export function GetCapabilities(): Promise<ProviderCapabilities> {
  return Promise.resolve(PROVIDER_CAPABILITIES);
}
