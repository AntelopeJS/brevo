export interface APIResponse<T = unknown> {
    status: number;
    data: T;
}
export interface Recipient {
    email: string;
}
export interface Attachment {
    name: string;
    url?: string;
    content?: string;
}
export type TransactionalMailParams = Record<string, string | undefined>;
export interface SendTransactionalMail {
    to: Recipient[];
    templateId: number;
    params?: TransactionalMailParams;
    attachment?: Attachment[];
}
export interface SendTransactionalSMS {
    sender: string;
    recipient: string;
    content: string;
    type?: 'transactional' | 'marketing';
    tag?: string;
    webUrl?: string;
    unicodeEnabled?: boolean;
    organisationPrefix?: string;
}
export declare function SendTemplate(body: SendTransactionalMail): Promise<APIResponse>;
export declare function SendSMS(body: SendTransactionalSMS): Promise<APIResponse>;
export type ContactAttributes = Record<string, unknown>;
export type ContactUnsubscriptions = Record<string, unknown>;
export type ContactTransactionalAttributes = Record<string, unknown>[];
export interface ContactEvent {
    campaignId: number;
    eventTime: string;
}
export interface ContactOpenedEvent extends ContactEvent {
    count: number;
    ip: string;
}
export interface ContactClickedLink {
    count: number;
    eventTime: string;
    ip: string;
    url: string;
}
export interface ContactClickedEvent {
    campaignId: number;
    links: ContactClickedLink[];
}
export interface ContactStatistics {
    messagesSent: ContactEvent[];
    hardBounces: ContactEvent[];
    softBounces: ContactEvent[];
    complaints: ContactEvent[];
    unsubscriptions: ContactUnsubscriptions;
    opened?: ContactOpenedEvent[];
    clicked?: ContactClickedEvent[];
    transacAttributes: ContactTransactionalAttributes;
    delivered: ContactEvent[];
}
export interface Contact {
    email?: string;
    id: number;
    emailBlacklisted: boolean;
    smsBlacklisted: boolean;
    createdAt: string;
    modifiedAt: string;
    listIds: number[];
    listUnsubscribed?: number[];
    attributes: ContactAttributes;
    statistics: ContactStatistics;
}
export type ContactMutationAttributes = Record<string, string | undefined>;
export interface AddContact {
    email?: string;
    ext_id?: string;
    attributes?: ContactMutationAttributes;
    emailBlacklisted?: boolean;
    smsBlacklisted?: boolean;
    listIds?: number[];
    updateEnabled?: boolean;
    smtpBlacklistSender?: string[];
}
export interface UpdateContact {
    attributes?: ContactMutationAttributes;
    ext_id?: string;
    emailBlacklisted?: boolean;
    smsBlacklisted?: boolean;
    listIds?: number[];
    unlinkListIds?: number[];
    smtpBlacklistSender?: string[];
}
export interface AddContactList {
    name: string;
    folderId: number;
}
export declare function contactDetails(identifier: string): Promise<APIResponse<Contact>>;
export declare function AddContact(body: AddContact): Promise<APIResponse>;
export declare function updateContact(identifier: string, body: UpdateContact): Promise<APIResponse>;
export declare function deleteContact(identifier: string): Promise<APIResponse>;
export declare function addContactList(body: AddContactList): Promise<APIResponse>;
export declare function deleteContactList(identifier: number): Promise<APIResponse>;
