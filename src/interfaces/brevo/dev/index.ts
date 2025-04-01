import { AsyncProxy } from '@ajs/core/1';

/**
 * @internal
 */
export namespace internal {
	export const sendTransactionalMailProxy = new AsyncProxy<(body: SendTransactionalMail) => Promise<APIResponse>>();
	export const contactDetailsProxy = new AsyncProxy<(identifier: string) => Promise<APIResponse<Contact>>>();
	export const addContactProxy = new AsyncProxy<(body: AddContact) => Promise<APIResponse>>();
	export const updateContactProxy = new AsyncProxy<
		(identifier: string, body: UpdateContact) => Promise<APIResponse>
	>();
	export const deleteContactProxy = new AsyncProxy<(identifier: string) => Promise<APIResponse>>();
	export const addContactListProxy = new AsyncProxy<(body: AddContactList) => Promise<APIResponse>>();
	export const deleteContactListProxy = new AsyncProxy<(identifier: number) => Promise<APIResponse>>();
}

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
	params?: { [k: string]: string | undefined };
	attachment?: Attachment[];
}

export function SendTemplate(body: SendTransactionalMail): Promise<APIResponse> {
	return internal.sendTransactionalMailProxy.call(body);
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
	attributes: any;
	statistics: {
		messagesSent: { campaignId: number; eventTime: string }[];
		hardBounces: { campaignId: number; eventTime: string }[];
		softBounces: { campaignId: number; eventTime: string }[];
		complaints: { campaignId: number; eventTime: string }[];
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
		delivered: { campaignId: number; eventTime: string }[];
	};
}

export interface AddContact {
	email?: string;
	ext_id?: string;
	attributes?: { [k: string]: string | undefined };
	emailBlacklisted?: boolean;
	smsBlacklisted?: boolean;
	listIds?: number[];
	updateEnabled?: boolean;
	smtpBlacklistSender?: string[];
}

export interface UpdateContact {
	attributes?: { [k: string]: string | undefined };
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

export function contactDetails(identifier: string): Promise<APIResponse<Contact>> {
	return internal.contactDetailsProxy.call(identifier);
}

export function AddContact(body: AddContact): Promise<APIResponse> {
	return internal.addContactProxy.call(body);
}

export function updateContact(identifier: string, body: UpdateContact): Promise<APIResponse> {
	return internal.updateContactProxy.call(identifier, body);
}

export function deleteContact(identifier: string): Promise<APIResponse> {
	return internal.deleteContactProxy.call(identifier);
}

export function addContactList(body: AddContactList): Promise<APIResponse> {
	return internal.addContactListProxy.call(body);
}

export function deleteContactList(identifier: number): Promise<APIResponse> {
	return internal.deleteContactListProxy.call(identifier);
}
