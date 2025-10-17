export interface APIResponse<T = any> {
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
export interface SendTransactionalMail {
    to: Recipient[];
    templateId: number;
    params?: {
        [k: string]: string | undefined;
    };
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
export interface Contact {
    email?: string;
    id: number;
    emailBlacklisted: boolean;
    smsBlacklisted: boolean;
    createdAt: string;
    modifiedAt: string;
    listIds: number[];
    listUnsubscribed?: number[];
    attributes: any;
    statistics: {
        messagesSent: {
            campaignId: number;
            eventTime: string;
        }[];
        hardBounces: {
            campaignId: number;
            eventTime: string;
        }[];
        softBounces: {
            campaignId: number;
            eventTime: string;
        }[];
        complaints: {
            campaignId: number;
            eventTime: string;
        }[];
        unsubscriptions: any;
        opened?: {
            campaignId: number;
            count: number;
            eventTime: string;
            ip: string;
        }[];
        clicked?: {
            campaignId: number;
            links: {
                count: number;
                eventTime: string;
                ip: string;
                url: string;
            }[];
        }[];
        transacAttributes: any[];
        delivered: {
            campaignId: number;
            eventTime: string;
        }[];
    };
}
export interface AddContact {
    email?: string;
    ext_id?: string;
    attributes?: {
        [k: string]: string | undefined;
    };
    emailBlacklisted?: boolean;
    smsBlacklisted?: boolean;
    listIds?: number[];
    updateEnabled?: boolean;
    smtpBlacklistSender?: string[];
}
export interface UpdateContact {
    attributes?: {
        [k: string]: string | undefined;
    };
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
