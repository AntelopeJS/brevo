import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, API_KEY, BASE_CONFIG, call, pick, requestsSeen, same, tuple, SENDER, withSession, type Json } from "./session.ts";

const SEND_AT = "2031-04-05T06:07:08.000Z";

const sendMapsMessage: Journey = {
  title: "Send maps every field of an email to one Brevo transactional request and answers queued with Brevo's message id",
  entryPoint: "`Send` of the email interface called through core",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const sent = await call(session, "send", "Send", [
        {
          to: ["ada@example.com", { email: "grace@example.com", name: "Grace" }],
          cc: "cc@example.com",
          bcc: [{ email: "bcc@example.com", name: "Blind" }],
          replyTo: { email: "reply@example.com", name: "Reply" },
          subject: "Hello",
          html: "<p>Hello</p>",
          text: "Hello",
          tags: ["welcome"],
          schedule: { sendAt: SEND_AT },
        },
      ]);
      const seen = await requestsSeen(session, "stand-in-log");
      const request = seen.entries[0];
      context.expect(sent.folder, [
        answered(sent),
        same("the answer is a success", pick(sent.value, "success"), true),
        same("the answer is queued", pick(sent.value, "status"), "queued"),
        same("the answer names the provider", pick(sent.value, "provider"), "brevo"),
        same("the message id is the one Brevo answered", pick(sent.value, "messageId"), "<message-1@brevo.stand-in>"),
      ]);
      context.expect(seen.result.folder, [
        same("Brevo received one request", seen.entries.length, 1),
        same("it is a POST to /v3/smtp/email", tuple(pick(request, "method"), pick(request, "path")), ["POST", "/v3/smtp/email"]),
        same("the api-key header is the configured key", pick(request, "apiKey"), API_KEY),
        same("the sender is the default sender", pick(request, "body", "sender"), SENDER),
        same("both recipients are mapped, a bare address without a name", pick(request, "body", "to"), [{ email: "ada@example.com" }, { email: "grace@example.com", name: "Grace" }]),
        same("cc keeps its address", pick(request, "body", "cc"), [{ email: "cc@example.com" }]),
        same("bcc keeps its name", pick(request, "body", "bcc"), [{ email: "bcc@example.com", name: "Blind" }]),
        same("replyTo is one address", pick(request, "body", "replyTo"), { email: "reply@example.com", name: "Reply" }),
        same("subject, html and text are carried", tuple(pick(request, "body", "subject"), pick(request, "body", "htmlContent"), pick(request, "body", "textContent")), ["Hello", "<p>Hello</p>", "Hello"]),
        same("tags are carried", pick(request, "body", "tags"), ["welcome"]),
        same("the schedule reaches Brevo as scheduledAt", pick(request, "body", "scheduledAt"), SEND_AT),
      ]);
    });
  },
};

const apiErrorMapping: Journey = {
  title: "a Brevo error answers failed with Brevo's code and message, retryable only for a 5xx",
  entryPoint: "`Send` while Brevo answers 400 then 503",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const message: Json = { to: "ada@example.com", subject: "Hello", text: "Hello" };
      session.api.reply(400, { code: "invalid_parameter", message: "Sender is not valid" });
      const rejected = await call(session, "send-rejected", "Send", [message]);
      session.api.reply(503, null);
      const unavailable = await call(session, "send-unavailable", "Send", [message]);
      context.expect(rejected.folder, [
        same("the answer is a failure", pick(rejected.value, "success"), false),
        same("the status is failed", pick(rejected.value, "status"), "failed"),
        same("the code is Brevo's", pick(rejected.value, "error", "code"), "invalid_parameter"),
        same("the message is Brevo's", pick(rejected.value, "error", "message"), "Sender is not valid"),
        same("a 400 is not retryable", pick(rejected.value, "error", "retryable"), false),
      ]);
      context.expect(unavailable.folder, [
        same("an empty 503 answers API_ERROR", pick(unavailable.value, "error", "code"), "API_ERROR"),
        same("the message names the HTTP status", pick(unavailable.value, "error", "message"), "HTTP 503"),
        same("a 5xx is retryable", pick(unavailable.value, "error", "retryable"), true),
      ]);
    });
  },
};

const missingSender: Journey = {
  title: "without a default sender or a from address nothing is sent; with a from address it becomes the sender",
  entryPoint: "`Send` on a module configured with an api key and no defaultSender",
  async run(context) {
    await withSession(context, { apiKey: API_KEY }, async (session) => {
      const refused = await call(session, "send-without-sender", "Send", [{ to: "ada@example.com", subject: "Hello", text: "Hello" }]);
      const before = await requestsSeen(session, "stand-in-log-before");
      const accepted = await call(session, "send-with-from", "Send", [{ to: "ada@example.com", from: "own@example.com", subject: "Hello", text: "Hello" }]);
      const after = await requestsSeen(session, "stand-in-log-after");
      context.expect(refused.folder, [
        same("the answer is a failure", pick(refused.value, "success"), false),
        same("the code is MISSING_SENDER", pick(refused.value, "error", "code"), "MISSING_SENDER"),
        same("a missing sender is not retryable", pick(refused.value, "error", "retryable"), false),
      ]);
      context.expect(before.result.folder, [same("Brevo received nothing", before.entries.length, 0)]);
      context.expect(accepted.folder, [same("the from address lets the send through", pick(accepted.value, "success"), true)]);
      context.expect(after.result.folder, [same("the from address is the sender Brevo received", pick(after.entries[0], "body", "sender"), { email: "own@example.com" })]);
    });
  },
};

const networkFailure: Journey = {
  title: "when Brevo cannot be reached Send answers a retryable SEND_FAILED instead of throwing",
  entryPoint: "`Send` while nothing listens where Brevo should answer",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      await session.api.close();
      const sent = await call(session, "send-unreachable", "Send", [{ to: "ada@example.com", subject: "Hello", text: "Hello" }]);
      context.expect(sent.folder, [
        answered(sent),
        same("the answer is a failure", pick(sent.value, "success"), false),
        same("the code is SEND_FAILED", pick(sent.value, "error", "code"), "SEND_FAILED"),
        same("a network failure is retryable", pick(sent.value, "error", "retryable"), true),
      ]);
    });
  },
};

export const sendJourneys = {
  "send-maps-message": sendMapsMessage,
  "api-error-mapping": apiErrorMapping,
  "missing-sender": missingSender,
  "network-failure": networkFailure,
};
