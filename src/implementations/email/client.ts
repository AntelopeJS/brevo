import type { TemplateEmailParams } from "@antelopejs/interface-email";
import axios from "axios";

export interface BrevoAddress {
  email: string;
  name?: string;
}

export interface BrevoAttachment {
  name: string;
  content?: string;
  url?: string;
}

export interface EmailClientConfig {
  apiKey: string;
  defaultSender?: BrevoAddress;
  emailWhitelist?: string[];
}

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export interface BrevoEmailBody {
  sender?: BrevoAddress;
  to: BrevoAddress[];
  cc?: BrevoAddress[];
  bcc?: BrevoAddress[];
  replyTo?: BrevoAddress;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachment?: BrevoAttachment[];
  tags?: string[];
  scheduledAt?: string;
  templateId?: number;
  params?: TemplateEmailParams["variables"];
}

export interface BrevoMessageVersion {
  to: BrevoAddress[];
  cc?: BrevoAddress[];
  bcc?: BrevoAddress[];
  replyTo?: BrevoAddress;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  attachment?: BrevoAttachment[];
}

export interface BrevoBatchBody {
  sender?: BrevoAddress;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  tags?: string[];
  scheduledAt?: string;
  messageVersions: BrevoMessageVersion[];
}

export interface BrevoEmailResponse {
  messageId?: string;
  code?: string;
  message?: string;
}

export interface BrevoBatchResponse {
  messageIds?: string[];
  messageId?: string;
  code?: string;
  message?: string;
}

const BASE_URL = "https://api.brevo.com/v3";
const TIMEOUT = 30000;

type HttpMethod = "get" | "post" | "put" | "delete";

let config: EmailClientConfig | undefined;

function getConfig(): EmailClientConfig {
  if (!config) {
    throw new Error("Email client config not initialized");
  }
  return config;
}

export function setConfig(newConfig: EmailClientConfig): void {
  config = newConfig;
}

export function getDefaultSender(): BrevoAddress | undefined {
  return getConfig().defaultSender;
}

export function getEmailWhitelist(): string[] | undefined {
  return getConfig().emailWhitelist;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  data: BrevoEmailBody | BrevoBatchBody,
): Promise<ApiResponse<T>> {
  const currentConfig = getConfig();
  const response = await axios.request({
    method,
    url: `${BASE_URL}${path}`,
    data,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": currentConfig.apiKey,
    },
    timeout: TIMEOUT,
    validateStatus: () => true,
  });

  return { status: response.status, data: response.data as T };
}

export const sendEmail = (
  body: BrevoEmailBody,
): Promise<ApiResponse<BrevoEmailResponse>> =>
  request<BrevoEmailResponse>("post", "/smtp/email", body);

export const sendBatchEmail = (
  body: BrevoBatchBody,
): Promise<ApiResponse<BrevoBatchResponse>> =>
  request<BrevoBatchResponse>("post", "/smtp/email", body);
