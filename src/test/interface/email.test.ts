import { GetCapabilities, Send, SendBatch, SendTemplate } from '@ajs/email/beta';
import axios, { AxiosResponse } from 'axios';
import assert from 'assert';
import sinon from 'sinon';
import type {
  BrevoBatchBody,
  BrevoBatchResponse,
  BrevoEmailBody,
  BrevoEmailResponse,
} from '../../implementations/email/beta/client';
import { setConfig } from '../../implementations/email/beta/client';

interface RequestConfig {
  method?: string;
  url?: string;
  data?: unknown;
}

const API_KEY = 'test-api-key';
const DEFAULT_SENDER_EMAIL = 'sender@example.com';
const DEFAULT_SENDER_NAME = 'Sender';
const DEFAULT_RECIPIENT = 'recipient@example.com';
const SMTP_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

describe('Email Interface', () => {
  beforeEach(() => {
    setConfig({
      apiKey: API_KEY,
      defaultSender: {
        email: DEFAULT_SENDER_EMAIL,
        name: DEFAULT_SENDER_NAME,
      },
    });

    sinon.stub(axios, 'request');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GetCapabilities', () => {
    it('returns brevo capabilities', async () => {
      const capabilities = await GetCapabilities();

      assert.equal(capabilities.name, 'brevo');
      assert.equal(capabilities.features.batch, true);
      assert.equal(capabilities.features.templates, true);
      assert.equal(capabilities.features.scheduling, true);
      assert.equal(capabilities.features.openTracking, true);
      assert.equal(capabilities.features.clickTracking, true);
      assert.equal(capabilities.features.inlineAttachments, true);
      assert.equal(capabilities.features.tags, true);
      assert.equal(capabilities.features.metadata, false);
      assert.equal(capabilities.features.priority, false);
    });
  });

  describe('Send', () => {
    it('sends email with default sender', async () => {
      stubRequest({ status: 201, data: { messageId: 'email-1' } });

      const result = await Send({
        to: DEFAULT_RECIPIENT,
        subject: 'Welcome',
        text: 'Body',
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 'queued');
      assert.equal(result.messageId, 'email-1');
      assert.equal(result.provider, 'brevo');

      const config = getRequestConfig(0);
      const body = config.data as BrevoEmailBody;

      assert.equal(config.method, 'post');
      assert.equal(config.url, SMTP_ENDPOINT);
      assert.equal(body.sender?.email, DEFAULT_SENDER_EMAIL);
      assert.equal(body.to[0]?.email, DEFAULT_RECIPIENT);
      assert.equal(body.subject, 'Welcome');
      assert.equal(body.textContent, 'Body');
    });

    it('returns missing sender error when sender is not configured', async () => {
      setConfig({ apiKey: API_KEY });

      const result = await Send({
        to: DEFAULT_RECIPIENT,
        subject: 'No sender',
      });

      assert.equal(result.success, false);
      assert.equal(result.error?.code, 'MISSING_SENDER');
      assert.equal(getRequestStub().called, false);
    });

    it('maps API error responses', async () => {
      stubRequest({
        status: 429,
        data: {
          code: 'RATE_LIMIT',
          message: 'Too many requests',
        },
      });

      const result = await Send({
        to: DEFAULT_RECIPIENT,
        subject: 'Rate limited',
      });

      assert.equal(result.success, false);
      assert.equal(result.error?.code, 'RATE_LIMIT');
      assert.equal(result.error?.message, 'Too many requests');
      assert.equal(result.error?.retryable, false);
    });

    it('skips sending when whitelist filters all recipients', async () => {
      setConfig({
        apiKey: API_KEY,
        defaultSender: {
          email: DEFAULT_SENDER_EMAIL,
          name: DEFAULT_SENDER_NAME,
        },
        emailWhitelist: ['^allowed@example.com$'],
      });

      const result = await Send({
        to: DEFAULT_RECIPIENT,
        subject: 'Filtered',
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 'queued');
      assert.equal(getRequestStub().called, false);
    });
  });

  describe('SendBatch', () => {
    it('sends batch emails and maps response IDs', async () => {
      stubRequest({
        status: 201,
        data: {
          messageIds: ['batch-1', 'batch-2'],
        },
      });

      const result = await SendBatch({
        messages: [
          { to: DEFAULT_RECIPIENT, subject: 'First', text: 'A', batchId: 'first' },
          { to: DEFAULT_RECIPIENT, subject: 'Second', text: 'B', batchId: 'second' },
        ],
      });

      assert.equal(result.success, true);
      assert.equal(result.total, 2);
      assert.equal(result.successful, 2);
      assert.equal(result.failed, 0);
      assert.equal(result.responses[0]?.messageId, 'batch-1');
      assert.equal(result.responses[1]?.messageId, 'batch-2');

      const config = getRequestConfig(0);
      const body = config.data as BrevoBatchBody;

      assert.equal(config.method, 'post');
      assert.equal(config.url, SMTP_ENDPOINT);
      assert.equal(body.messageVersions.length, 2);
    });

    it('fails every batch message when sender is missing', async () => {
      setConfig({ apiKey: API_KEY });

      const result = await SendBatch({
        messages: [
          { to: DEFAULT_RECIPIENT, subject: 'First', text: 'A', batchId: 'first' },
          { to: DEFAULT_RECIPIENT, subject: 'Second', text: 'B', batchId: 'second' },
        ],
      });

      assert.equal(result.success, false);
      assert.equal(result.total, 2);
      assert.equal(result.successful, 0);
      assert.equal(result.failed, 2);
      assert.equal(result.responses[0]?.error?.code, 'MISSING_SENDER');
      assert.equal(getRequestStub().called, false);
    });
  });

  describe('SendTemplate', () => {
    it('sends inline template content', async () => {
      stubRequest({ status: 202, data: { messageId: 'template-1' } });

      const result = await SendTemplate({
        to: DEFAULT_RECIPIENT,
        subject: 'Template',
        template: {
          content: 'Hello {{ name }}',
          type: 'html',
        },
        variables: {
          name: 'Ada',
        },
      });

      assert.equal(result.success, true);
      assert.equal(result.messageId, 'template-1');

      const config = getRequestConfig(0);
      const body = config.data as BrevoEmailBody;

      assert.equal(body.htmlContent, 'Hello Ada');
      assert.equal(body.templateId, undefined);
    });

    it('returns a validation error for invalid provider template IDs', async () => {
      const result = await SendTemplate({
        to: DEFAULT_RECIPIENT,
        subject: 'Invalid provider template',
        template: {
          id: 'not-a-number',
        },
      });

      assert.equal(result.success, false);
      assert.equal(result.error?.code, 'INVALID_TEMPLATE_ID');
      assert.equal(getRequestStub().called, false);
    });

    it('sends provider template with numeric template ID', async () => {
      stubRequest({ status: 202, data: { messageId: 'template-2' } });

      const result = await SendTemplate({
        to: DEFAULT_RECIPIENT,
        subject: 'Provider template',
        template: {
          id: '42',
        },
        variables: {
          plan: 'pro',
        },
      });

      assert.equal(result.success, true);
      assert.equal(result.messageId, 'template-2');

      const config = getRequestConfig(0);
      const body = config.data as BrevoEmailBody;

      assert.equal(body.templateId, 42);
      assert.equal(body.params?.plan, 'pro');
    });
  });
});

function getRequestStub(): sinon.SinonStub {
  return axios.request as sinon.SinonStub;
}

function getRequestConfig(index: number): RequestConfig {
  const call = getRequestStub().getCall(index);
  assert(call, `Request call ${index} not found`);
  return call.args[0] as RequestConfig;
}

function stubRequest(response: StubResponse): void {
  getRequestStub().resolves(createAxiosResponse(response));
}

interface StubResponse {
  status: number;
  data: BrevoEmailResponse | BrevoBatchResponse;
}

function createAxiosResponse(response: StubResponse): AxiosResponse<BrevoEmailResponse | BrevoBatchResponse> {
  return {
    status: response.status,
    data: response.data,
  } as AxiosResponse<BrevoEmailResponse | BrevoBatchResponse>;
}
