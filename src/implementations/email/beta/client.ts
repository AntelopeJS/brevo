import axios from 'axios';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface EmailClientConfig {
  apiKey: string;
  defaultSender?: { email: string; name?: string };
}

const BASE_URL = 'https://api.brevo.com/v3';
const TIMEOUT = 30000;

let config: EmailClientConfig;

export function setConfig(newConfig: EmailClientConfig) {
  config = newConfig;
}

export function getDefaultSender() {
  return config.defaultSender;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
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
// BREVO API TYPES
// =============================================================================

export interface BrevoAddress {
  email: string;
  name?: string;
}

export interface BrevoAttachment {
  name: string;
  content?: string;
  url?: string;
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
  params?: Record<string, unknown>;
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
  params?: Record<string, unknown>;
}

export interface BrevoBatchBody {
  sender?: BrevoAddress;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
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

// =============================================================================
// API FUNCTIONS
// =============================================================================

export const sendEmail = (body: BrevoEmailBody) => request<BrevoEmailResponse>('post', '/smtp/email', body);

export const sendBatchEmail = (body: BrevoBatchBody) => request<BrevoBatchResponse>('post', '/smtp/email', body);
