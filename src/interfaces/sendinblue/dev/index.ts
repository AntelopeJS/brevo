import { AsyncProxy } from '@ajs/core/1';

/**
 * @internal
 */
export namespace internal {
	export const sendTransactionalMailProxy = new AsyncProxy<(body: SendTransactionalMail) => Promise<APIResponse>>();
	export const addContactProxy = new AsyncProxy<(body: AddContact) => Promise<APIResponse>>();
	export const updateContactProxy = new AsyncProxy<
		(identifier: string, body: UpdateContact) => Promise<APIResponse>
	>();
	export const deleteContactProxy = new AsyncProxy<(identifier: string) => Promise<APIResponse>>();
}

export interface APIResponse {
	status: number;
	data: any;
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
	params?: { [k: string]: string };
	attachment?: Attachment[];
}

export function SendTemplate(body: SendTransactionalMail): Promise<APIResponse> {
	return internal.sendTransactionalMailProxy.call(body);
}

export interface AddContact {
	email?: string;
	ext_id?: string;
	attributes?: {
		sms?: never;
		nom?: string;
		prenom?: string;
	};
	emailBlacklisted?: boolean;
	smsBlacklisted?: boolean;
	listIds?: number[];
	updateEnabled?: boolean;
	smtpBlacklistSender?: string[];
}

export interface UpdateContact {
	attributes?: {
		sms?: never;
		nom?: string;
		prenom?: string;
	};
	ext_id?: string;
	emailBlacklisted?: boolean;
	smsBlacklisted?: boolean;
	listIds?: number[];
	unlinkListIds?: number[];
	smtpBlacklistSender?: string[];
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
