export interface EmailAddressObject {
    email: string;
    name?: string;
}
/** Email address as string or object with optional display name */
export type EmailAddress = string | EmailAddressObject;
export interface BaseAttachment {
    /** Filename shown to recipient */
    filename: string;
    /** MIME type (e.g., "application/pdf") */
    contentType?: string;
    /** Content-ID for inline images (use in HTML as `cid:yourCid`) */
    cid?: string;
    /** If true, embed in HTML body instead of attaching */
    inline?: boolean;
}
export interface BufferAttachment extends BaseAttachment {
    content: Buffer;
}
export interface Base64Attachment extends BaseAttachment {
    content: string;
    encoding: "base64";
}
export interface PathAttachment extends BaseAttachment {
    path: string;
}
export interface UrlAttachment extends BaseAttachment {
    url: string;
}
export type Attachment = BufferAttachment | Base64Attachment | PathAttachment | UrlAttachment;
export interface TrackingOptions {
    /** Track when recipient opens the email */
    opens?: boolean;
    /** Track when recipient clicks links */
    clicks?: boolean;
    /** Custom domain for tracking URLs */
    trackingDomain?: string;
    /** Disable all tracking */
    disabled?: boolean;
}
export interface ScheduleOptions {
    /** When to send (ISO 8601 string or Date) */
    sendAt?: Date | string;
    /** IANA timezone (e.g., "Europe/Paris") */
    timezone?: string;
}
export type EmailPriority = "high" | "normal" | "low";
export interface EmailParams {
    /** Recipient(s) */
    to: EmailAddress | EmailAddress[];
    /** Subject line */
    subject: string;
    /** Plain text body */
    text?: string;
    /** HTML body */
    html?: string;
    /** Sender address (uses provider default if omitted) */
    from?: EmailAddress;
    /** Reply-to address(es) */
    replyTo?: EmailAddress | EmailAddress[];
    /** CC recipients */
    cc?: EmailAddress | EmailAddress[];
    /** BCC recipients */
    bcc?: EmailAddress | EmailAddress[];
    /** File attachments */
    attachments?: Attachment[];
    /** Custom Message-ID header */
    messageId?: string;
    /** Message-ID of the email being replied to (for threading) */
    inReplyTo?: string;
    /** Message-IDs of the thread (for threading) */
    references?: string | string[];
    /** Email priority */
    priority?: EmailPriority;
    /** Tracking options */
    tracking?: TrackingOptions;
    /** Tags for categorization/analytics */
    tags?: string[];
    /** Custom metadata (returned in webhook events) */
    metadata?: Record<string, string>;
    /** Schedule for later delivery */
    schedule?: ScheduleOptions;
    /** Provider-specific options (use sparingly) */
    providerOptions?: Record<string, unknown>;
}
/** Reference to a template hosted by the provider */
export interface ProviderTemplate {
    /** Template ID in provider's system */
    id: string;
    /** Template version (if supported) */
    version?: string;
}
/** Inline template content */
export interface InlineTemplate {
    /** Template content with placeholders */
    content: string;
    /** Content type */
    type: "html" | "text";
    /** Template engine hint (e.g., "handlebars", "mustache") */
    engine?: string;
}
export interface TemplateEmailParams {
    /** Recipient(s) */
    to: EmailAddress | EmailAddress[];
    /** Template to use */
    template: ProviderTemplate | InlineTemplate;
    /** Variables for template substitution */
    variables?: Record<string, unknown>;
    /** Per-recipient variables (keyed by email address) */
    recipientVariables?: Record<string, Record<string, unknown>>;
    from?: EmailAddress;
    replyTo?: EmailAddress | EmailAddress[];
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    /** Override template subject */
    subject?: string;
    attachments?: Attachment[];
    priority?: EmailPriority;
    tracking?: TrackingOptions;
    tags?: string[];
    metadata?: Record<string, string>;
    schedule?: ScheduleOptions;
    providerOptions?: Record<string, unknown>;
}
/** Single message in a batch */
export interface BatchEmailMessage extends EmailParams {
    /** Identifier to match with response */
    batchId?: string;
}
/** Parameters for sending multiple emails in batch */
export interface BatchEmailParams {
    /** Messages to send */
    messages: BatchEmailMessage[];
    /** Default values applied to all messages */
    defaults?: Partial<EmailParams>;
    /** Continue sending if a message fails (default: true) */
    continueOnError?: boolean;
}
/** Email delivery status */
export type EmailStatus = "queued" | "sent" | "delivered" | "failed" | "rejected" | "scheduled" | "unknown";
export interface EmailError {
    code: string;
    /** Human-readable message */
    message: string;
    /** Field that caused the error */
    field?: string;
    /** Whether retrying might succeed */
    retryable?: boolean;
}
/** Response from Send or SendTemplate */
export interface EmailResponse {
    success: boolean;
    /** Current status */
    status: EmailStatus;
    /** Provider-assigned message ID (for tracking) */
    messageId?: string;
    /** Error details if failed */
    error?: EmailError;
    /** When the email was accepted */
    timestamp?: Date;
    /** Provider that handled the request */
    provider?: string;
}
export interface BatchEmailMessageResponse extends EmailResponse {
    /** Batch ID from the original message */
    batchId?: string;
    /** Index in the original messages array */
    index: number;
    /** Recipient address */
    recipient: string;
}
export interface BatchEmailResponse {
    /** True if all messages succeeded */
    success: boolean;
    /** Total messages in batch */
    total: number;
    /** Successfully sent */
    successful: number;
    /** Failed to send */
    failed: number;
    /** Individual results */
    responses: BatchEmailMessageResponse[];
}
/** Capabilities and limits of the email provider */
export interface ProviderCapabilities {
    /** Provider name */
    name: string;
    /** Provider version */
    version?: string;
    /** Max recipients per email */
    maxRecipients?: number;
    /** Max messages per batch */
    maxBatchSize?: number;
    /** Max attachment size in bytes */
    maxAttachmentSize?: number;
    /** Max total email size in bytes */
    maxEmailSize?: number;
    /** Supported features */
    features: {
        batch: boolean;
        templates: boolean;
        scheduling: boolean;
        openTracking: boolean;
        clickTracking: boolean;
        inlineAttachments: boolean;
        tags: boolean;
        metadata: boolean;
        priority: boolean;
    };
}
/**
 * Send a single email
 * @example
 * ```ts
 * const result = await Send({
 *   to: "user@example.com",
 *   subject: "Hello",
 *   html: "<p>Welcome!</p>"
 * });
 * ```
 */
export declare const Send: (params: EmailParams) => Promise<EmailResponse>;
/**
 * Send multiple emails in batch
 * @example
 * ```ts
 * const result = await SendBatch({
 *   messages: [
 *     { to: "a@example.com", subject: "Hi A", text: "Hello A" },
 *     { to: "b@example.com", subject: "Hi B", text: "Hello B" }
 *   ],
 *   defaults: { from: "noreply@myapp.com" }
 * });
 * ```
 */
export declare const SendBatch: (params: BatchEmailParams) => Promise<BatchEmailResponse>;
/**
 * Send an email using a template
 * @example
 * ```ts
 * const result = await SendTemplate({
 *   to: "user@example.com",
 *   template: { id: "welcome-v2" },
 *   variables: { name: "John", url: "https://..." }
 * });
 * ```
 */
export declare const SendTemplate: (params: TemplateEmailParams) => Promise<EmailResponse>;
/**
 * Get provider capabilities and limits
 * @example
 * ```ts
 * const caps = await GetCapabilities();
 * if (caps.features.scheduling) {
 *   // Can use schedule option
 * }
 * ```
 */
export declare const GetCapabilities: () => Promise<ProviderCapabilities>;
