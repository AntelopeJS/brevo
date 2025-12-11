import {
  APIResponse,
  AddContact,
  SendTransactionalMail,
  SendTransactionalSMS,
  UpdateContact,
  AddContactList,
  Contact,
} from '@ajs.local/brevo/dev';
export { APIResponse } from '@ajs.local/brevo/dev';
import axios from 'axios';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface BrevoConfig {
  apiKey: string;
  defaultSender?: { email: string; name?: string };
}

const BASE_URL = 'https://api.brevo.com/v3';
const TIMEOUT = 30000;

let config: BrevoConfig;

export function setConfig(newConfig: BrevoConfig) {
  config = newConfig;
}

export function getDefaultSender() {
  return config.defaultSender;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  data?: unknown,
): Promise<APIResponse<T>> {
  const response = await axios({
    method,
    url: `${BASE_URL}${path}`,
    data,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': config.apiKey,
    },
    timeout: TIMEOUT,
    validateStatus: () => true,
  });
  return { status: response.status, data: response.data };
}

// =============================================================================
// TYPES
// =============================================================================

export interface SendEmailBody {
  sender?: { email: string; name?: string };
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  bcc?: { email: string; name?: string }[];
  replyTo?: { email: string; name?: string };
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachment?: { name: string; content?: string; url?: string }[];
  tags?: string[];
  scheduledAt?: string;
  templateId?: number;
  params?: Record<string, unknown>;
}

export interface MessageVersion {
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  bcc?: { email: string; name?: string }[];
  replyTo?: { email: string; name?: string };
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  attachment?: { name: string; content?: string; url?: string }[];
  params?: Record<string, unknown>;
}

export interface SendBatchEmailBody {
  sender?: { email: string; name?: string };
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

// =============================================================================
// API FUNCTIONS
// =============================================================================

export const sendEmail = (body: SendEmailBody) => request<void>('post', '/smtp/email', body);

export const sendBatchEmail = (body: SendBatchEmailBody) => request<BatchEmailResponse>('post', '/smtp/email', body);

export const sendTransactionalMail = (body: SendTransactionalMail) => request<void>('post', '/smtp/email', body);

export const sendTransactionalSMS = (body: SendTransactionalSMS) =>
  request<void>('post', '/transactionalSMS/sms', body);

export const contactDetails = (identifier: string) =>
  request<Contact>('get', `/contacts/${encodeURIComponent(identifier)}`);

export const addContact = (body: AddContact) => request<void>('post', '/contacts', body);

export const updateContact = (identifier: string, body: UpdateContact) =>
  request<void>('put', `/contacts/${encodeURIComponent(identifier)}`, body);

export const deleteContact = (identifier: string) =>
  request<void>('delete', `/contacts/${encodeURIComponent(identifier)}`);

export const addContactList = (body: AddContactList) => request<void>('post', '/contacts/lists', body);

export const deleteContactList = (listId: number) => request<void>('delete', `/contacts/lists/${listId}`);
