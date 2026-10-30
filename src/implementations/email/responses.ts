import type {
  BatchEmailMessageResponse,
  EmailResponse,
} from "@antelopejs/interface-email";

import { type ApiResponse, type BrevoEmailResponse } from "./client";

export const PROVIDER_NAME = "brevo";

const HTTP_SUCCESS_MIN = 200;

const HTTP_SUCCESS_MAX = 299;

const MISSING_SENDER_CODE = "MISSING_SENDER";

const MISSING_SENDER_MESSAGE =
  "No sender address provided and no default sender configured";

export function isHttpSuccess(status: number): boolean {
  return status >= HTTP_SUCCESS_MIN && status <= HTTP_SUCCESS_MAX;
}

export function createErrorResponse(
  code: string,
  message: string,
  retryable: boolean,
): EmailResponse {
  return {
    success: false,
    status: "failed",
    error: { code, message, retryable },
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

export function createSuccessResponse(messageId?: string): EmailResponse {
  return {
    success: true,
    status: "queued",
    messageId,
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

export function createBatchItemResponse(
  base: EmailResponse,
  batchId: string | undefined,
  index: number,
  recipient: string,
): BatchEmailMessageResponse {
  return { ...base, batchId, index, recipient };
}

export function mapApiResponse(
  response: ApiResponse<BrevoEmailResponse>,
): EmailResponse {
  if (isHttpSuccess(response.status)) {
    return createSuccessResponse(response.data?.messageId);
  }

  const errorCode = response.data?.code ?? "API_ERROR";
  const errorMessage = response.data?.message ?? `HTTP ${response.status}`;
  return createErrorResponse(errorCode, errorMessage, response.status >= 500);
}

export function createMissingSenderResponse(): EmailResponse {
  return createErrorResponse(
    MISSING_SENDER_CODE,
    MISSING_SENDER_MESSAGE,
    false,
  );
}
