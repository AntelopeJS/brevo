import type {
  AddContact,
  AddContactList,
  APIResponse,
  Contact,
  SendTransactionalMail,
  SendTransactionalSMS,
  UpdateContact,
} from "@ajs.local/brevo/dev";

export { APIResponse } from "@ajs.local/brevo/dev";

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

export interface BrevoConfig {
  apiKey: string;
  defaultSender?: BrevoAddress;
  emailWhitelist?: string[];
}

const BASE_URL = "https://api.brevo.com/v3";
const TIMEOUT = 30000;

type HttpMethod = "get" | "post" | "put" | "delete";

let config: BrevoConfig | undefined;

function getConfig(): BrevoConfig {
  if (!config) {
    throw new Error("Brevo config not initialized");
  }
  return config;
}

export function setConfig(newConfig: BrevoConfig): void {
  config = newConfig;
}

export function getDefaultSender(): BrevoAddress | undefined {
  return getConfig().defaultSender;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  data?: unknown,
): Promise<APIResponse<T>> {
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

export interface SendEmailBody {
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
  params?: Record<string, unknown>;
}

export interface MessageVersion {
  to: BrevoAddress[];
  cc?: BrevoAddress[];
  bcc?: BrevoAddress[];
  replyTo?: BrevoAddress;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  attachment?: BrevoAttachment[];
  params?: Record<string, unknown>;
}

export interface SendBatchEmailBody {
  sender?: BrevoAddress;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
  tags?: string[];
  scheduledAt?: string;
  messageVersions: MessageVersion[];
}

export interface BatchEmailResponse {
  messageIds?: string[];
  messageId?: string;
  code?: string;
  message?: string;
}

export const sendEmail = (body: SendEmailBody): Promise<APIResponse<void>> =>
  request<void>("post", "/smtp/email", body);

export const sendBatchEmail = (
  body: SendBatchEmailBody,
): Promise<APIResponse<BatchEmailResponse>> =>
  request<BatchEmailResponse>("post", "/smtp/email", body);

export const sendTransactionalMail = (
  body: SendTransactionalMail,
): Promise<APIResponse<void>> => request<void>("post", "/smtp/email", body);

export const sendTransactionalSMS = (
  body: SendTransactionalSMS,
): Promise<APIResponse<void>> =>
  request<void>("post", "/transactionalSMS/sms", body);

export const contactDetails = (
  identifier: string,
): Promise<APIResponse<Contact>> =>
  request<Contact>("get", `/contacts/${encodeURIComponent(identifier)}`);

export const addContact = (body: AddContact): Promise<APIResponse<void>> =>
  request<void>("post", "/contacts", body);

export const updateContact = (
  identifier: string,
  body: UpdateContact,
): Promise<APIResponse<void>> =>
  request<void>("put", `/contacts/${encodeURIComponent(identifier)}`, body);

export const deleteContact = (identifier: string): Promise<APIResponse<void>> =>
  request<void>("delete", `/contacts/${encodeURIComponent(identifier)}`);

export const addContactList = (
  body: AddContactList,
): Promise<APIResponse<void>> => request<void>("post", "/contacts/lists", body);

export const deleteContactList = (listId: number): Promise<APIResponse<void>> =>
  request<void>("delete", `/contacts/lists/${listId}`);
