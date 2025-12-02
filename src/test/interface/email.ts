import { Send, SendBatch, SendTemplate, GetCapabilities } from '@ajs/email/beta';
import { Logging } from '@ajs/logging/beta';
import assert from 'assert';

const TEST_EMAIL = process.env.TEST_EMAIL;

describe('Email Interface', () => {
  before(() => {
    if (!TEST_EMAIL) {
      throw new Error('TEST_EMAIL environment variable is required');
    }
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is required');
    }
  });

  describe('GetCapabilities', () => {
    it('should return brevo provider name', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.name, 'brevo');
    });

    it('should have batch feature enabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.batch, true);
    });

    it('should have templates feature enabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.templates, true);
    });

    it('should have scheduling feature enabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.scheduling, true);
    });

    it('should have tracking features enabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.openTracking, true);
      assert.equal(caps.features.clickTracking, true);
    });

    it('should have webhooks feature disabled (not implemented yet)', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.webhooks, false);
    });

    it('should have inlineAttachments feature enabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.inlineAttachments, true);
    });

    it('should have tags feature enabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.tags, true);
    });

    it('should have metadata feature disabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.metadata, false);
    });

    it('should have priority feature disabled', async () => {
      const caps = await GetCapabilities();
      assert.equal(caps.features.priority, false);
    });
  });

  describe('Send', () => {
    it('should send a simple email with html and text', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Simple email',
        html: '<h1>Test</h1><p>This is a test email sent from unit tests.</p>',
        text: 'Test - This is a test email sent from unit tests.',
      });
      if (!result.success) {
        Logging.Warn('Send failed:', JSON.stringify(result, null, 2));
      }
      assert.equal(result.success, true, `Expected success but got error: ${result.error?.message}`);
      assert.equal(result.status, 'queued');
      assert(result.messageId, 'Should have a messageId');
      assert.equal(result.provider, 'brevo');
    });

    it('should send email with tags', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Email with tags',
        html: '<p>This email has tags for tracking.</p>',
        tags: ['test', 'unit-test', 'brevo'],
      });
      assert.equal(result.success, true);
      assert.equal(result.status, 'queued');
    });

    it('should send email with multiple recipients', async () => {
      const result = await Send({
        to: [TEST_EMAIL!, TEST_EMAIL!],
        subject: '[Brevo Test] Multiple recipients',
        text: 'This email is sent to multiple recipients.',
      });
      assert.equal(result.success, true);
    });

    it('should send email with CC', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        cc: TEST_EMAIL!,
        subject: '[Brevo Test] Email with CC',
        text: 'This email has a CC recipient.',
      });
      assert.equal(result.success, true);
    });

    it('should send email with BCC', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        bcc: TEST_EMAIL!,
        subject: '[Brevo Test] Email with BCC',
        text: 'This email has a BCC recipient.',
      });
      assert.equal(result.success, true);
    });

    it('should send email with replyTo', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        replyTo: TEST_EMAIL!,
        subject: '[Brevo Test] Email with replyTo',
        text: 'This email has a custom replyTo address.',
      });
      assert.equal(result.success, true);
    });

    it('should send email with address object (name + email)', async () => {
      const result = await Send({
        to: { email: TEST_EMAIL!, name: 'Test User' },
        subject: '[Brevo Test] Email with named recipient',
        text: 'This email is sent to a named recipient.',
      });
      assert.equal(result.success, true);
    });

    it('should send email with base64 attachment', async () => {
      const base64Content = Buffer.from('Hello, this is a test attachment!').toString('base64');
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Email with attachment',
        text: 'This email has a base64 attachment.',
        attachments: [
          {
            filename: 'test.txt',
            content: base64Content,
            encoding: 'base64',
            contentType: 'text/plain',
          },
        ],
      });
      assert.equal(result.success, true);
    });

    it('should send email with Buffer attachment', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Email with Buffer attachment',
        text: 'This email has a Buffer attachment.',
        attachments: [
          {
            filename: 'buffer-test.txt',
            content: Buffer.from('This is content from a Buffer'),
            contentType: 'text/plain',
          },
        ],
      });
      assert.equal(result.success, true);
    });

    it('should send scheduled email with Date object', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Scheduled email (Date)',
        text: 'This is a scheduled email using Date object.',
        schedule: { sendAt: futureDate },
      });
      assert.equal(result.success, true);
    });

    it('should send scheduled email with ISO string', async () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 hours
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Scheduled email (ISO)',
        text: 'This is a scheduled email using ISO string.',
        schedule: { sendAt: futureDate.toISOString() },
      });
      assert.equal(result.success, true);
    });

    it('should send email with URL attachment', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Email with URL attachment',
        text: 'This email has a URL attachment.',
        attachments: [
          {
            filename: 'logo.png',
            url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
          },
        ],
      });
      assert.equal(result.success, true);
    });

    it('should send email with tracking options', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Email with tracking',
        // eslint-disable-next-line max-len
        html: '<p>This email has tracking enabled. Click <a href="https://example.com">here</a> to test click tracking.</p>',
        tracking: { opens: true, clicks: true },
      });
      assert.equal(result.success, true);
    });

    it('should send email with custom from address', async () => {
      const result = await Send({
        to: TEST_EMAIL!,
        from: { email: 'email-test@antelopejs.com', name: 'Custom Sender' },
        subject: '[Brevo Test] Custom from address',
        text: 'This email has a custom from address.',
      });
      assert.equal(result.success, true);
    });
  });

  describe('SendBatch', () => {
    it('should send batch emails', async () => {
      const result = await SendBatch({
        messages: [
          { to: TEST_EMAIL!, subject: '[Brevo Test] Batch 1/3', text: 'Batch message 1', batchId: 'batch-1' },
          { to: TEST_EMAIL!, subject: '[Brevo Test] Batch 2/3', text: 'Batch message 2', batchId: 'batch-2' },
          { to: TEST_EMAIL!, subject: '[Brevo Test] Batch 3/3', text: 'Batch message 3', batchId: 'batch-3' },
        ],
      });
      assert.equal(result.success, true);
      assert.equal(result.total, 3);
      assert.equal(result.successful, 3);
      assert.equal(result.failed, 0);
      assert.equal(result.responses.length, 3);
    });

    it('should send batch emails with defaults', async () => {
      const result = await SendBatch({
        messages: [
          { to: TEST_EMAIL!, subject: '[Brevo Test] Batch with defaults 1', batchId: 'def-1' },
          { to: TEST_EMAIL!, subject: '[Brevo Test] Batch with defaults 2', batchId: 'def-2' },
        ],
        defaults: {
          text: 'Default text content for batch messages',
          tags: ['batch-test', 'defaults'],
        },
      });
      if (!result.success) {
        Logging.Warn('SendBatch with defaults failed:', JSON.stringify(result, null, 2));
      }
      assert.equal(result.success, true);
      assert.equal(result.total, 2);
      assert.equal(result.successful, 2);
    });

    it('should include batchId in responses', async () => {
      const result = await SendBatch({
        messages: [
          { to: TEST_EMAIL!, subject: '[Brevo Test] BatchId test', text: 'Testing batchId', batchId: 'custom-id-123' },
        ],
      });
      assert.equal(result.success, true);
      assert.equal(result.responses[0].batchId, 'custom-id-123');
    });

    it('should include recipient in responses', async () => {
      const result = await SendBatch({
        messages: [{ to: TEST_EMAIL!, subject: '[Brevo Test] Recipient test', text: 'Testing recipient' }],
      });
      assert.equal(result.success, true);
      assert.equal(result.responses[0].recipient, TEST_EMAIL);
    });

    it('should send batch with scheduled emails', async () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // +3 hours
      const result = await SendBatch({
        messages: [
          { to: TEST_EMAIL!, subject: '[Brevo Test] Scheduled Batch 1', text: 'Scheduled batch 1', batchId: 'sched-1' },
          { to: TEST_EMAIL!, subject: '[Brevo Test] Scheduled Batch 2', text: 'Scheduled batch 2', batchId: 'sched-2' },
        ],
        defaults: {
          schedule: { sendAt: futureDate },
        },
      });
      assert.equal(result.success, true);
      assert.equal(result.total, 2);
      assert.equal(result.successful, 2);
    });
  });

  describe('SendTemplate', () => {
    it('should send inline HTML template with variables', async () => {
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Inline HTML template',
        template: {
          content: `
            <h1>Hello {{ name }}!</h1>
            <p>Your verification code is: <strong>{{ code }}</strong></p>
            <p>This code expires in {{ expiry }} minutes.</p>
          `,
          type: 'html',
        },
        variables: {
          name: 'Test User',
          code: '123456',
          expiry: '15',
        },
      });
      assert.equal(result.success, true);
      assert.equal(result.status, 'queued');
    });

    it('should send inline text template with variables', async () => {
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Inline text template',
        template: {
          content: 'Hello {{ name }}, your code is {{ code }}.',
          type: 'text',
        },
        variables: {
          name: 'Test User',
          code: 'ABC123',
        },
      });
      assert.equal(result.success, true);
    });

    it('should handle template with missing variables gracefully', async () => {
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Template with missing vars',
        template: {
          content: '<p>Hello {{ name }}, value is {{ missing }}</p>',
          type: 'html',
        },
        variables: {
          name: 'Test User',
        },
      });
      assert.equal(result.success, true);
    });

    it('should send template with tags', async () => {
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Template with tags',
        template: {
          content: '<p>Template email with tags</p>',
          type: 'html',
        },
        tags: ['template-test', 'with-tags'],
      });
      assert.equal(result.success, true);
    });

    it('should return error for invalid provider template ID', async () => {
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Invalid template',
        template: {
          id: 'not-a-number',
        },
      });
      assert.equal(result.success, false);
      assert.equal(result.error?.code, 'INVALID_TEMPLATE_ID');
    });

    it('should send template with scheduling', async () => {
      const futureDate = new Date(Date.now() + 4 * 60 * 60 * 1000); // +4 hours
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Scheduled template',
        template: {
          content: '<p>This is a scheduled template email for {{ name }}</p>',
          type: 'html',
        },
        variables: { name: 'Test User' },
        schedule: { sendAt: futureDate },
      });
      assert.equal(result.success, true);
    });

    it('should send template with tracking options', async () => {
      const result = await SendTemplate({
        to: TEST_EMAIL!,
        subject: '[Brevo Test] Template with tracking',
        template: {
          content: '<p>Click <a href="https://example.com">here</a> {{ name }} to test tracking.</p>',
          type: 'html',
        },
        variables: { name: 'Test User' },
        tracking: { opens: true, clicks: true },
      });
      assert.equal(result.success, true);
    });
  });
});
