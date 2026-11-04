import { Logging } from "@antelopejs/interface-core/logging";
import type {
  BatchEmailMessage,
  BatchEmailMessageResponse,
  BatchEmailParams,
  BatchEmailResponse,
  EmailParams,
  EmailResponse,
} from "@antelopejs/interface-email";

import {
  type BrevoAddress,
  type BrevoBatchBody,
  sendBatchEmail,
} from "./client";
import {
  createBatchItemResponse,
  createErrorResponse,
  createMissingSenderResponse,
  createSuccessResponse,
  isHttpSuccess,
} from "./responses";
import {
  applyFilteredRecipientsToEmailParams,
  applyWhitelist,
  getFirstRecipient,
} from "./recipients";
import { buildMessageVersion, formatScheduledAt } from "./message";

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

export interface BatchScope {
  defaults: Partial<EmailParams> | undefined;
  sender: BrevoAddress;
}

export const BATCH_CHUNK_SIZE = 1000;

export function buildBatchMissingSenderResponse(
  params: BatchEmailParams,
): BatchEmailResponse {
  const responses = params.messages.map((message, index) =>
    createBatchItemResponse(
      createMissingSenderResponse(),
      message.batchId,
      index,
      getFirstRecipient(message.to),
    ),
  );

  return {
    success: false,
    total: params.messages.length,
    successful: 0,
    failed: responses.length,
    responses,
  };
}

function mergeBatchMessage(
  defaults: Partial<EmailParams> | undefined,
  message: BatchEmailMessage,
): EmailParams {
  return { ...defaults, ...message };
}

export function createInitialBatchState(params: BatchEmailParams): BatchState {
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
      Logging.Warn(
        "[brevo/email] All recipients filtered by whitelist, skipping batch message",
      );
      state.responses.push(
        createBatchItemResponse(
          createSuccessResponse(),
          message.batchId,
          index,
          getFirstRecipient(merged.to),
        ),
      );
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

export function splitIntoChunks<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export function buildBatchBody(
  chunk: BatchPreparedMessage[],
  scope: BatchScope,
): BrevoBatchBody {
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

function buildChunkSuccessProgress(
  chunk: BatchPreparedMessage[],
  messageIds: string[],
): BatchProgress {
  const responses = chunk.map((entry, index) =>
    createBatchItemResponse(
      createSuccessResponse(messageIds[index]),
      entry.batchId,
      entry.index,
      getFirstRecipient(entry.params.to),
    ),
  );

  return {
    responses,
    successful: responses.length,
    failed: 0,
  };
}

function buildChunkFailureProgress(
  chunk: BatchPreparedMessage[],
  error: EmailResponse,
): BatchProgress {
  const responses = chunk.map((entry) =>
    createBatchItemResponse(
      error,
      entry.batchId,
      entry.index,
      getFirstRecipient(entry.params.to),
    ),
  );

  return {
    responses,
    successful: 0,
    failed: responses.length,
  };
}

export async function executeBatchChunk(
  chunk: BatchPreparedMessage[],
  body: BrevoBatchBody,
  continueOnError: boolean,
): Promise<BatchChunkResult> {
  try {
    const response = await sendBatchEmail(body);

    if (isHttpSuccess(response.status)) {
      const messageIds = response.data?.messageIds ?? [];
      return {
        ...buildChunkSuccessProgress(chunk, messageIds),
        shouldStop: false,
      };
    }

    const errorCode = response.data?.code ?? "API_ERROR";
    const errorMessage = response.data?.message ?? `HTTP ${response.status}`;
    const error = createErrorResponse(
      errorCode,
      errorMessage,
      response.status >= 500,
    );
    return {
      ...buildChunkFailureProgress(chunk, error),
      shouldStop: !continueOnError,
    };
  } catch (error) {
    const batchError = createErrorResponse(
      "BATCH_SEND_FAILED",
      error instanceof Error ? error.message : String(error),
      true,
    );
    return {
      ...buildChunkFailureProgress(chunk, batchError),
      shouldStop: !continueOnError,
    };
  }
}

export function appendBatchProgress(
  target: BatchProgress,
  source: BatchProgress,
): void {
  target.responses.push(...source.responses);
  target.successful += source.successful;
  target.failed += source.failed;
}

export function createBatchResponse(
  total: number,
  progress: BatchProgress,
): BatchEmailResponse {
  return {
    success: progress.failed === 0,
    total,
    successful: progress.successful,
    failed: progress.failed,
    responses: progress.responses,
  };
}
