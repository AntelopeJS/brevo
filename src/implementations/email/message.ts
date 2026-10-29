import { Logging } from "@antelopejs/interface-core/logging";
import type {
  Attachment,
  EmailParams,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

import {
  type BrevoAddress,
  type BrevoAttachment,
  type BrevoEmailBody,
  type BrevoMessageVersion,
} from "./client";
import {
  type WhitelistResult,
  formatAddresses,
  formatSingleAddress,
} from "./recipients";

function mapAttachmentContent(attachment: Attachment): string | undefined {
  if (!("content" in attachment)) {
    return undefined;
  }

  if (attachment.content instanceof Buffer) {
    return attachment.content.toString("base64");
  }

  if ("encoding" in attachment && attachment.encoding === "base64") {
    return attachment.content;
  }

  return undefined;
}

function mapAttachment(attachment: Attachment): BrevoAttachment | null {
  if ("path" in attachment) {
    Logging.Error(
      `[brevo/email] PathAttachment not supported, "${attachment.filename}" ignored`,
    );
    return null;
  }

  if ("url" in attachment) {
    return { name: attachment.filename, url: attachment.url };
  }

  const content = mapAttachmentContent(attachment);
  if (!content) {
    return null;
  }

  return { name: attachment.filename, content };
}

function mapAttachments(
  attachments: Attachment[] | undefined,
): BrevoAttachment[] | undefined {
  if (!attachments || attachments.length === 0) {
    return undefined;
  }

  const mapped = attachments
    .map((attachment) => mapAttachment(attachment))
    .filter((attachment): attachment is BrevoAttachment => attachment !== null);

  return mapped.length > 0 ? mapped : undefined;
}

export function formatScheduledAt(
  schedule: EmailParams["schedule"],
): string | undefined {
  if (!schedule?.sendAt) {
    return undefined;
  }

  return schedule.sendAt instanceof Date
    ? schedule.sendAt.toISOString()
    : schedule.sendAt;
}

export function buildEmailBody(
  params: EmailParams,
  sender: BrevoAddress,
): BrevoEmailBody {
  const body: BrevoEmailBody = {
    sender,
    to: formatAddresses(params.to) ?? [],
    subject: params.subject,
  };

  const cc = formatAddresses(params.cc);
  const bcc = formatAddresses(params.bcc);
  const replyTo = formatSingleAddress(params.replyTo);
  const attachments = mapAttachments(params.attachments);
  const scheduledAt = formatScheduledAt(params.schedule);

  if (params.html) body.htmlContent = params.html;
  if (params.text) body.textContent = params.text;
  if (cc) body.cc = cc;
  if (bcc) body.bcc = bcc;
  if (replyTo) body.replyTo = replyTo;
  if (attachments) body.attachment = attachments;
  if (params.tags) body.tags = params.tags;
  if (scheduledAt) body.scheduledAt = scheduledAt;

  return body;
}

export function buildMessageVersion(params: EmailParams): BrevoMessageVersion {
  const version: BrevoMessageVersion = {
    to: formatAddresses(params.to) ?? [],
  };

  const cc = formatAddresses(params.cc);
  const bcc = formatAddresses(params.bcc);
  const replyTo = formatSingleAddress(params.replyTo);
  const attachments = mapAttachments(params.attachments);

  if (params.subject) version.subject = params.subject;
  if (params.html) version.htmlContent = params.html;
  if (params.text) version.textContent = params.text;
  if (cc) version.cc = cc;
  if (bcc) version.bcc = bcc;
  if (replyTo) version.replyTo = replyTo;
  if (attachments) version.attachment = attachments;

  return version;
}

export function buildTemplateBody(
  params: TemplateEmailParams,
  sender: BrevoAddress,
  templateId: number,
  filtered: WhitelistResult,
): BrevoEmailBody {
  const body: BrevoEmailBody = {
    sender,
    to: formatAddresses(filtered.to) ?? [],
    subject: params.subject ?? "",
    templateId,
  };

  const cc = formatAddresses(filtered.cc);
  const bcc = formatAddresses(filtered.bcc);
  const replyTo = formatSingleAddress(params.replyTo);
  const attachments = mapAttachments(params.attachments);
  const scheduledAt = formatScheduledAt(params.schedule);

  if (params.variables) body.params = params.variables;
  if (cc) body.cc = cc;
  if (bcc) body.bcc = bcc;
  if (replyTo) body.replyTo = replyTo;
  if (attachments) body.attachment = attachments;
  if (params.tags) body.tags = params.tags;
  if (scheduledAt) body.scheduledAt = scheduledAt;

  return body;
}
