import type {
  EmailParams,
  InlineTemplate,
  JsonObject,
  JsonValue,
  ProviderTemplate,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

const TEMPLATE_TOKEN = /\{\{\s*([^{}]*?)\s*\}\}/g;

function isText(value: JsonValue): value is string {
  return typeof value === "string";
}

function isScalar(value: JsonValue): value is number | boolean {
  return (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  );
}

function isStructured(value: JsonValue): value is JsonValue[] | JsonObject {
  return Array.isArray(value) || (value !== null && typeof value === "object");
}

function stringifyTemplateValue(value: JsonValue | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (isText(value)) {
    return value;
  }

  if (isScalar(value)) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isStructured(value)) {
    return JSON.stringify(value) ?? "";
  }

  return "";
}

export function renderTemplate(
  template: InlineTemplate,
  variables: NonNullable<TemplateEmailParams["variables"]>,
): string {
  const values = new Map(Object.entries(variables));
  return template.content.replace(
    TEMPLATE_TOKEN,
    (token: string, name: string) =>
      values.has(name) ? stringifyTemplateValue(values.get(name)) : token,
  );
}

export function isProviderTemplate(
  template: ProviderTemplate | InlineTemplate,
): template is ProviderTemplate {
  return "id" in template;
}

export function buildInlineTemplateEmailParams(
  params: TemplateEmailParams,
  template: InlineTemplate,
  renderedContent: string,
): EmailParams {
  const emailParams: EmailParams = {
    to: params.to,
    subject: params.subject ?? "",
    from: params.from,
    replyTo: params.replyTo,
    cc: params.cc,
    bcc: params.bcc,
    attachments: params.attachments,
    priority: params.priority,
    tags: params.tags,
    metadata: params.metadata,
    schedule: params.schedule,
    providerOptions: params.providerOptions,
  };

  if (template.type === "html") {
    emailParams.html = renderedContent;
  } else {
    emailParams.text = renderedContent;
  }

  return emailParams;
}

export function parseTemplateId(templateId: string): number | null {
  if (!/^\d+$/.test(templateId)) {
    return null;
  }
  const parsedTemplateId = Number(templateId);
  return Number.isSafeInteger(parsedTemplateId) ? parsedTemplateId : null;
}
