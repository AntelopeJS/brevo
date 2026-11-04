import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, API_KEY, BASE_CONFIG, call, pick, requestsSeen, same, SENDER, tuple, withSession, type Json } from "./session.ts";

const WHITELIST_CONFIG = { ...BASE_CONFIG, emailWhitelist: ["@example\\.com$"] };

const whitelistFilters: Journey = {
  title: "emailWhitelist removes every to, cc and bcc address that matches no pattern before Brevo sees the request",
  entryPoint: "`Send` on a module configured with `emailWhitelist`",
  async run(context) {
    await withSession(context, WHITELIST_CONFIG, async (session) => {
      const sent = await call(session, "send", "Send", [
        { to: ["ada@example.com", "mallory@other.org"], cc: "eve@other.org", bcc: ["bob@example.com", "trent@other.org"], subject: "Hello", text: "Hello" },
      ]);
      const seen = await requestsSeen(session, "stand-in-log");
      const body = pick(seen.entries[0], "body");
      context.expect(sent.folder, [answered(sent), same("the send succeeds", pick(sent.value, "success"), true)]);
      context.expect(seen.result.folder, [
        same("Brevo received one request", seen.entries.length, 1),
        same("only the whitelisted to address remains", pick(body, "to"), [{ email: "ada@example.com" }]),
        same("a cc with no whitelisted address is dropped", pick(body, "cc"), null),
        same("only the whitelisted bcc address remains", pick(body, "bcc"), [{ email: "bob@example.com" }]),
      ]);
    });
  },
};

const whitelistAllFiltered: Journey = {
  title: "when the whitelist removes every recipient the send succeeds without a message id and Brevo receives nothing",
  entryPoint: "`Send` and `SendTemplate` on a module configured with `emailWhitelist`",
  async run(context) {
    await withSession(context, WHITELIST_CONFIG, async (session) => {
      const sent = await call(session, "send", "Send", [{ to: "mallory@other.org", subject: "Hello", text: "Hello" }]);
      const templated = await call(session, "send-template", "SendTemplate", [{ to: "mallory@other.org", template: { id: "7" } }]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(sent.folder, [
        same("Send reports success", pick(sent.value, "success"), true),
        same("Send has no message id", pick(sent.value, "messageId"), null),
      ]);
      context.expect(templated.folder, [
        same("SendTemplate reports success", pick(templated.value, "success"), true),
        same("SendTemplate has no message id", pick(templated.value, "messageId"), null),
      ]);
      context.expect(seen.result.folder, [same("Brevo received nothing", seen.entries.length, 0)]);
    });
  },
};

const attachmentMapping: Journey = {
  title: "url and base64 attachments reach Brevo; a local path attachment is dropped instead of read",
  entryPoint: "`Send` with an `attachments` list",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const attachments: Json = [
        { filename: "report.pdf", url: "https://files.example.com/report.pdf" },
        { filename: "note.txt", content: "aGVsbG8=", encoding: "base64" },
        { filename: "secret.txt", path: "/etc/hostname" },
      ];
      const sent = await call(session, "send", "Send", [{ to: "ada@example.com", subject: "Files", text: "Files", attachments }]);
      const only: Json = [{ filename: "secret.txt", path: "/etc/hostname" }];
      const pathOnly = await call(session, "send-path-only", "Send", [{ to: "ada@example.com", subject: "Files", text: "Files", attachments: only }]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(sent.folder, [answered(sent), same("the send succeeds", pick(sent.value, "success"), true)]);
      context.expect(pathOnly.folder, [answered(pathOnly), same("a path-only send succeeds", pick(pathOnly.value, "success"), true)]);
      context.expect(seen.result.folder, [
        same("Brevo received both requests", seen.entries.length, 2),
        same(
          "the url and the base64 attachment are mapped, the path one is not",
          pick(seen.entries[0], "body", "attachment"),
          [{ name: "report.pdf", url: "https://files.example.com/report.pdf" }, { name: "note.txt", content: "aGVsbG8=" }],
        ),
        same("a path-only list sends no attachment field", pick(seen.entries[1], "body", "attachment"), null),
        same("the key and sender still go with the request", tuple(pick(seen.entries[0], "apiKey"), pick(seen.entries[0], "body", "sender")), [API_KEY, SENDER]),
      ]);
    });
  },
};

export const recipientJourneys = {
  "whitelist-filters": whitelistFilters,
  "whitelist-all-filtered": whitelistAllFiltered,
  "attachment-mapping": attachmentMapping,
};
