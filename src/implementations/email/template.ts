import type {
  EmailParams,
  InlineTemplate,
  ProviderTemplate,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value) ?? "";
  }

  return "";
}

export function renderTemplate(
  template: InlineTemplate,
  variables: NonNullable<TemplateEmailParams["variables"]>,
): string {
  return Object.entries(variables).reduce((content, [key, value]) => {
    const tokenPattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    return content.replace(tokenPattern, stringifyTemplateValue(value));
  }, template.content);
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
  const parsedTemplateId = Number.parseInt(templateId, 10);
  return Number.isNaN(parsedTemplateId) ? null : parsedTemplateId;
}
