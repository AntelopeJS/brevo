import { Logging } from '@ajs/logging/beta';
import { Send, SendBatch, SendTemplate, GetCapabilities } from '@ajs/email/beta';

// ENV Configuration
const TEST_EMAIL = process.env.TEST_EMAIL;

export async function start(): Promise<void> {
  if (!TEST_EMAIL) {
    Logging.Error('TEST_EMAIL environment variable is not set');
    return;
  }

  if (!process.env.BREVO_API_KEY) {
    Logging.Error('BREVO_API_KEY environment variable is not set');
    return;
  }

  Logging.Info(`=== Starting Brevo Email Tests (sending to: ${TEST_EMAIL}) ===`);

  // Test 1: Email simple
  Logging.Info('[Test 1] Sending simple email...');
  const result1 = await Send({
    to: TEST_EMAIL,
    subject: '[Brevo Test] Email simple',
    html: '<h1>Test</h1><p>Ceci est un email de test simple envoyé depuis le playground Brevo.</p>',
    text: 'Test - Ceci est un email de test simple envoyé depuis le playground Brevo.',
  });
  Logging.Info(`[Test 1] Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`, JSON.stringify(result1, null, 2));

  // Test 2: Email avec options (tags)
  Logging.Info('[Test 2] Sending email with tags...');
  const result2 = await Send({
    to: TEST_EMAIL,
    subject: '[Brevo Test] Email avec tags',
    html: '<p>Cet email contient des tags pour le tracking.</p>',
    tags: ['test', 'playground', 'brevo'],
  });
  Logging.Info(`[Test 2] Result: ${result2.success ? 'SUCCESS' : 'FAILED'}`, JSON.stringify(result2, null, 2));

  // Test 3: Batch - envoi de 3 emails
  Logging.Info('[Test 3] Sending batch emails...');
  const result3 = await SendBatch({
    messages: [
      { to: TEST_EMAIL, subject: '[Brevo Test] Batch 1/3', text: 'Message batch numéro 1', batchId: 'batch-1' },
      { to: TEST_EMAIL, subject: '[Brevo Test] Batch 2/3', text: 'Message batch numéro 2', batchId: 'batch-2' },
      { to: TEST_EMAIL, subject: '[Brevo Test] Batch 3/3', text: 'Message batch numéro 3', batchId: 'batch-3' },
    ],
  });
  Logging.Info(
    `[Test 3] Result: ${result3.success ? 'SUCCESS' : 'FAILED'} (${result3.successful}/${result3.total} sent)`,
    JSON.stringify(result3, null, 2),
  );

  // Test 4: Template inline avec variables
  Logging.Info('[Test 4] Sending template email...');
  const result4 = await SendTemplate({
    to: TEST_EMAIL,
    subject: '[Brevo Test] Template inline',
    template: {
      content: `
        <h1>Bonjour {{ name }} !</h1>
        <p>Voici votre code de vérification : <strong>{{ code }}</strong></p>
        <p>Ce code expire dans {{ expiry }} minutes.</p>
      `,
      type: 'html',
    },
    variables: {
      name: 'Fabrice',
      code: '123456',
      expiry: '15',
    },
  });
  Logging.Info(`[Test 4] Result: ${result4.success ? 'SUCCESS' : 'FAILED'}`, JSON.stringify(result4, null, 2));

  // Test 5: GetCapabilities
  Logging.Info('[Test 5] Getting provider capabilities...');
  const capabilities = await GetCapabilities();
  Logging.Info('[Test 5] Capabilities:', JSON.stringify(capabilities, null, 2));

  Logging.Info('=== All tests completed ===');
}
