import type {
  EmailParams,
  InlineTemplate,
  ProviderTemplate,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

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
