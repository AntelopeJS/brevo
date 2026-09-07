import { Send } from "@antelopejs/interface-email";
import { Logging } from "@antelopejs/interface-core/logging";

const TEST_EMAIL = process.env.TEST_EMAIL;

export function construct(): void {
  Logging.Info("Email playground initialized");
}

export async function start(): Promise<void> {
  if (!TEST_EMAIL) {
    Logging.Error("TEST_EMAIL environment variable is not set");
    return;
  }

  if (!process.env.BREVO_API_KEY) {
    Logging.Error("BREVO_API_KEY environment variable is not set");
    return;
  }

  Logging.Info(`=== Sending test email (to: ${TEST_EMAIL}) ===`);

  const result = await Send({
    to: TEST_EMAIL,
    subject: "[Brevo Test] Email Test",
    html: `
      <h1>Test email</h1>
      <p>Cet email est un test de l'interface email Brevo.</p>
      <p><a href="https://antelopejs.com">Cliquez ici pour visiter AntelopeJS</a></p>
    `,
    text: "Test email - Ouvrez la version HTML pour voir le contenu.",
    tracking: { opens: true, clicks: true },
    tags: ["playground-test"],
  });

  if (result.success) {
    Logging.Info(`Email sent successfully! MessageId: ${result.messageId}`);
  } else {
    Logging.Error("Failed to send email:", result.error?.message);
  }
}
