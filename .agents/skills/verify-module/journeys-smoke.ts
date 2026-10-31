import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, BASE_CONFIG, call, pick, requestsSeen, same, tuple, withSession } from "./session.ts";

const capabilities: Journey = {
  title: "GetCapabilities names the provider and the features the module supports",
  entryPoint: "`GetCapabilities` of the email interface called through core",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const answer = await call(session, "capabilities", "GetCapabilities", []);
      context.expect(answer.folder, [
        answered(answer),
        same("the provider is brevo", pick(answer.value, "name"), "brevo"),
        same(
          "the supported features are exactly the module's",
          pick(answer.value, "features"),
          { batch: true, templates: true, scheduling: true, openTracking: true, clickTracking: true, inlineAttachments: true, tags: true, metadata: false, priority: false },
        ),
      ]);
    });
  },
};

const sendThroughStandIn: Journey = {
  title: "a consumer's Send reaches the Brevo API with the configured key and comes back queued",
  entryPoint: "`Send` through core against the stand-in for api.brevo.com",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const sent = await call(session, "send", "Send", [{ to: "ada@example.com", subject: "Hello", text: "Hello" }]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(sent.folder, [answered(sent), same("the answer is queued", pick(sent.value, "status"), "queued")]);
      context.expect(seen.result.folder, [
        same("Brevo received the message at /v3/smtp/email", tuple(...seen.entries.map((entry) => pick(entry, "path"))), ["/v3/smtp/email"]),
        same("the recipient is the one the consumer named", pick(seen.entries[0], "body", "to"), [{ email: "ada@example.com" }]),
      ]);
    });
  },
};

const liveContract: Journey = {
  title: "the module against the real Brevo API",
  entryPoint: "`Send` against https://api.brevo.com/v3 with a sandbox key",
  run(context) {
    return Promise.resolve(
      context.notVerified(
        "no journey reaches the real Brevo API: the module hard-codes https://api.brevo.com/v3 and Brevo offers no sandbox mode that drops a message, so every other journey runs against a stand-in that stands for Brevo's documented answers",
      ),
    );
  },
};

export const smokeJourneys = {
  capabilities,
  "send-through-stand-in": sendThroughStandIn,
  "live-contract": liveContract,
};
