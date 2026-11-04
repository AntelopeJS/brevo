import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, BASE_CONFIG, call, pick, requestsSeen, same, withSession } from "./session.ts";

const inlineTemplate: Journey = {
  title: "an inline template has its {{ variables }} replaced and is sent as html or text content",
  entryPoint: "`SendTemplate` with an inline template",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const html = await call(session, "send-html", "SendTemplate", [
        { to: "ada@example.com", subject: "Order", template: { type: "html", content: "<p>Hi {{ name }}, total {{total}} {{ name }}</p>" }, variables: { name: "Ada", total: 42 } },
      ]);
      const text = await call(session, "send-text", "SendTemplate", [
        { to: "ada@example.com", subject: "Order", template: { type: "text", content: "Hi {{name}}" }, variables: { name: "Ada" } },
      ]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(html.folder, [answered(html), same("the html send succeeds", pick(html.value, "success"), true)]);
      context.expect(text.folder, [answered(text), same("the text send succeeds", pick(text.value, "success"), true)]);
      context.expect(seen.result.folder, [
        same("Brevo received two requests", seen.entries.length, 2),
        same("every occurrence is replaced and numbers are written out", pick(seen.entries[0], "body", "htmlContent"), "<p>Hi Ada, total 42 Ada</p>"),
        same("an html template sends no text part", pick(seen.entries[0], "body", "textContent"), null),
        same("a text template is sent as text content", pick(seen.entries[1], "body", "textContent"), "Hi Ada"),
        same("a text template sends no html part", pick(seen.entries[1], "body", "htmlContent"), null),
        same("the subject comes from the call", pick(seen.entries[0], "body", "subject"), "Order"),
      ]);
    });
  },
};

const providerTemplate: Journey = {
  title: "a provider template id and its variables reach Brevo as templateId and params",
  entryPoint: "`SendTemplate` with a provider template",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const sent = await call(session, "send", "SendTemplate", [
        { to: "ada@example.com", template: { id: "12" }, variables: { name: "Ada", plan: "pro" }, tags: ["onboarding"] },
      ]);
      const seen = await requestsSeen(session, "stand-in-log");
      const body = pick(seen.entries[0], "body");
      context.expect(sent.folder, [answered(sent), same("the send succeeds", pick(sent.value, "success"), true)]);
      context.expect(seen.result.folder, [
        same("Brevo received one request", seen.entries.length, 1),
        same("the template id is a number", pick(body, "templateId"), 12),
        same("the variables become params", pick(body, "params"), { name: "Ada", plan: "pro" }),
        same("a missing subject is an empty string", pick(body, "subject"), ""),
        same("tags are carried", pick(body, "tags"), ["onboarding"]),
        same("the sender is the default sender", pick(body, "sender", "email"), "sender@verify.test"),
      ]);
    });
  },
};

const invalidTemplateId: Journey = {
  title: "a provider template id that is not a number is refused before any request leaves",
  entryPoint: "`SendTemplate` with the id `welcome`",
  async run(context) {
    await withSession(context, BASE_CONFIG, async (session) => {
      const refused = await call(session, "send", "SendTemplate", [{ to: "ada@example.com", template: { id: "welcome" } }]);
      const seen = await requestsSeen(session, "stand-in-log");
      context.expect(refused.folder, [
        same("the answer is a failure", pick(refused.value, "success"), false),
        same("the code is INVALID_TEMPLATE_ID", pick(refused.value, "error", "code"), "INVALID_TEMPLATE_ID"),
        same("it is not retryable", pick(refused.value, "error", "retryable"), false),
      ]);
      context.expect(seen.result.folder, [same("Brevo received nothing", seen.entries.length, 0)]);
    });
  },
};

export const templateJourneys = {
  "inline-template": inlineTemplate,
  "provider-template": providerTemplate,
  "invalid-template-id": invalidTemplateId,
};
