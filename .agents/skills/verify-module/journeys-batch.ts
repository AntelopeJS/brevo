import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, BASE_CONFIG, call, pick, requestsSeen, same, tuple, size, withSession, type Json } from "./session.ts";

const CHUNK = 1000;

function messages(count: number): Json[] {
  return Array.from({ length: count }, (_, index) => ({ to: `user${index}@example.com`, subject: `Hello ${index}`, text: `Hello ${index}`, batchId: `b${index}` }));
}

const batchMapsMessages: Journey = {
  title: "SendBatch sends one request whose defaults and per-message versions match the call, and answers each message with its own id",
  entryPoint: "`SendBatch` with defaults and two messages",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const sent = await call(session, "send-batch", "SendBatch", [
        {
          defaults: { subject: "Default subject", html: "<p>Default</p>", tags: ["bulk"] },
          messages: [
            { to: "ada@example.com", batchId: "first" },
            { to: { email: "grace@example.com", name: "Grace" }, subject: "Own subject", batchId: "second" },
          ],
        },
      ]);
      const seen = await requestsSeen(session, "stand-in-log");
      const body = pick(seen.entries[0], "body");
      context.expect(sent.folder, [
        answered(sent),
        same("the batch succeeded", pick(sent.value, "success"), true),
        same("total, successful and failed add up", tuple(pick(sent.value, "total"), pick(sent.value, "successful"), pick(sent.value, "failed")), [2, 2, 0]),
        same("each response keeps its index, batch id and recipient", tuple(pick(sent.value, "responses", 0, "index"), pick(sent.value, "responses", 0, "batchId"), pick(sent.value, "responses", 0, "recipient")), [0, "first", "ada@example.com"]),
        same("the second response has Brevo's second message id", pick(sent.value, "responses", 1, "messageId"), "<batch-1-1@brevo.stand-in>"),
      ]);
      context.expect(seen.result.folder, [
        same("Brevo received one request", seen.entries.length, 1),
        same("the defaults become the shared fields", tuple(pick(body, "subject"), pick(body, "htmlContent"), pick(body, "tags")), ["Default subject", "<p>Default</p>", ["bulk"]]),
        same("each message is one version, with its own subject when it has one", tuple(pick(body, "messageVersions", 0, "to"), pick(body, "messageVersions", 0, "subject"), pick(body, "messageVersions", 1, "subject")), [[{ email: "ada@example.com" }], "Default subject", "Own subject"]),
      ]);
    });
  },
};

const batchChunks: Journey = {
  title: "a batch larger than 1000 messages is split into requests of at most 1000 versions",
  entryPoint: "`SendBatch` with 1001 messages",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const sent = await call(session, "send-batch", "SendBatch", [{ messages: messages(CHUNK + 1) }]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(sent.folder, [
        answered(sent),
        same("total and successful cover every message", tuple(pick(sent.value, "total"), pick(sent.value, "successful"), pick(sent.value, "failed")), [CHUNK + 1, CHUNK + 1, 0]),
        same("the last message is the 1001st response", pick(sent.value, "responses", CHUNK, "recipient"), `user${CHUNK}@example.com`),
      ]);
      context.expect(seen.result.folder, [
        same("Brevo received two requests", seen.entries.length, 2),
        same("the first request holds 1000 versions", size(pick(seen.entries[0], "body", "messageVersions")), CHUNK),
      ]);
    });
  },
};

const batchErrorHandling: Journey = {
  title: "a failing chunk fails its own messages; continueOnError decides whether the next chunk is still sent",
  entryPoint: "`SendBatch` with 1001 messages while Brevo rejects the first chunk",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      session.api.reply(500, { code: "internal_error", message: "try later" });
      const continued = await call(session, "send-continue", "SendBatch", [{ messages: messages(CHUNK + 1) }]);
      const afterContinue = await requestsSeen(session, "stand-in-log-continue");
      session.api.reply(500, { code: "internal_error", message: "try later" });
      const stopped = await call(session, "send-stop", "SendBatch", [{ messages: messages(CHUNK + 1), continueOnError: false }]);
      const afterStop = await requestsSeen(session, "stand-in-log-stop");
      context.expect(continued.folder, [
        same("the batch is not a success", pick(continued.value, "success"), false),
        same("1000 failed and the last message was sent", tuple(pick(continued.value, "failed"), pick(continued.value, "successful")), [CHUNK, 1]),
        same("a failed message carries Brevo's code and a retryable 5xx", tuple(pick(continued.value, "responses", 0, "error", "code"), pick(continued.value, "responses", 0, "error", "retryable")), ["internal_error", true]),
      ]);
      context.expect(afterContinue.result.folder, [same("both chunks were sent", afterContinue.entries.length, 2)]);
      context.expect(stopped.folder, [same("only the first chunk's messages are answered", tuple(pick(stopped.value, "failed"), pick(stopped.value, "successful"), pick(stopped.value, "total")), [CHUNK, 0, CHUNK + 1])]);
      context.expect(afterStop.result.folder, [same("continueOnError false sent one more request, not two", afterStop.entries.length - afterContinue.entries.length, 1)]);
    });
  },
};

const batchMissingSender: Journey = {
  title: "a batch with no sender fails every message with MISSING_SENDER and sends nothing",
  entryPoint: "`SendBatch` on a module with no defaultSender",
  async run(context) {
    await withSession(context, { apiKey: "verify-key" }, async (session) => {
      const sent = await call(session, "send-batch", "SendBatch", [{ messages: messages(2) }]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(sent.folder, [
        same("the batch is not a success", pick(sent.value, "success"), false),
        same("both messages failed", tuple(pick(sent.value, "total"), pick(sent.value, "failed")), [2, 2]),
        same("each carries MISSING_SENDER", tuple(pick(sent.value, "responses", 0, "error", "code"), pick(sent.value, "responses", 1, "error", "code")), ["MISSING_SENDER", "MISSING_SENDER"]),
      ]);
      context.expect(seen.result.folder, [same("Brevo received nothing", seen.entries.length, 0)]);
    });
  },
};

const batchWhitelist: Journey = {
  title: "batch messages whose recipients the whitelist removes count as successful and are not sent",
  entryPoint: "`SendBatch` on a module configured with `emailWhitelist`",
  async run(context) {
    await withSession(context, { ...BASE_CONFIG, emailWhitelist: ["@example\\.com$"] }, async (session) => {
      const sent = await call(session, "send-batch", "SendBatch", [
        { messages: [{ to: "ada@example.com", subject: "A", text: "A" }, { to: "mallory@other.org", subject: "B", text: "B" }] },
      ]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(sent.folder, [
        same("both messages count as successful", tuple(pick(sent.value, "total"), pick(sent.value, "successful"), pick(sent.value, "failed")), [2, 2, 0]),
        same("the filtered message is answered first, without a message id", tuple(pick(sent.value, "responses", 0, "recipient"), pick(sent.value, "responses", 0, "messageId")), ["mallory@other.org", null]),
      ]);
      context.expect(seen.result.folder, [
        same("Brevo received one request", seen.entries.length, 1),
        same("it holds only the whitelisted recipient", pick(seen.entries[0], "body", "messageVersions"), [{ to: [{ email: "ada@example.com" }], subject: "A", textContent: "A" }]),
      ]);
    });
  },
};

export const batchJourneys = {
  "batch-maps-messages": batchMapsMessages,
  "batch-chunks": batchChunks,
  "batch-error-handling": batchErrorHandling,
  "batch-missing-sender": batchMissingSender,
  "batch-whitelist": batchWhitelist,
};
