import { Logging } from '@ajs/logging/beta';
import { Send, OnDelivered, OnBounced, OnOpened, OnClicked, OnComplaint, OnUnsubscribed } from '@ajs/email/beta';

const TEST_EMAIL = process.env.TEST_EMAIL;

export function construct(): void {
  // Register event listeners to test the warning messages
  Logging.Info('Registering email event listeners...');

  OnDelivered.register((event) => {
    Logging.Info('[Event] OnDelivered:', JSON.stringify(event, null, 2));
  });

  OnBounced.register((event) => {
    Logging.Info('[Event] OnBounced:', JSON.stringify(event, null, 2));
  });

  OnOpened.register((event) => {
    Logging.Info('[Event] OnOpened:', JSON.stringify(event, null, 2));
  });

  OnClicked.register((event) => {
    Logging.Info('[Event] OnClicked:', JSON.stringify(event, null, 2));
  });

  OnComplaint.register((event) => {
    Logging.Info('[Event] OnComplaint:', JSON.stringify(event, null, 2));
  });

  OnUnsubscribed.register((event) => {
    Logging.Info('[Event] OnUnsubscribed:', JSON.stringify(event, null, 2));
  });

  Logging.Info('Event listeners registered (you should see warnings above about events not being implemented)');
}

export async function start(): Promise<void> {
  if (!TEST_EMAIL) {
    Logging.Error('TEST_EMAIL environment variable is not set');
    return;
  }

  if (!process.env.BREVO_API_KEY) {
    Logging.Error('BREVO_API_KEY environment variable is not set');
    return;
  }

  Logging.Info(`=== Sending test email for events (to: ${TEST_EMAIL}) ===`);

  const result = await Send({
    to: TEST_EMAIL,
    subject: '[Brevo Test] Email Events Test',
    html: `
      <h1>Test des événements email</h1>
      <p>Cet email permet de tester les événements suivants:</p>
      <ul>
        <li><strong>OnDelivered</strong> - Déclenché à la réception</li>
        <li><strong>OnOpened</strong> - Déclenché à l'ouverture</li>
        <li><strong>OnClicked</strong> - Cliquez sur le lien ci-dessous</li>
      </ul>
      <p><a href="https://antelopejs.com">Cliquez ici pour tester OnClicked</a></p>
      <p>Note: Les événements ne seront pas reçus car les webhooks ne sont pas encore implémentés.</p>
    `,
    text: 'Test des événements email - Ouvrez la version HTML pour tester.',
    tracking: { opens: true, clicks: true },
    tags: ['events-test', 'playground'],
  });

  if (result.success) {
    Logging.Info(`Email sent successfully! MessageId: ${result.messageId}`);
    Logging.Info('Note: Events will NOT be received as webhooks are not implemented yet.');
  } else {
    Logging.Error('Failed to send email:', result.error?.message);
  }
}
