import { AsyncProxy } from '@ajs/core/1';

/**
 * @internal
 */
export namespace internal {
	export const sendTransactionalMail = new AsyncProxy<(body: SendTransactionalMail) => Promise<APIResponse>>();
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
	params: { [k: string]: string };
	attachments: Attachment[];
}

export function SendTemplate(body: SendTransactionalMail): Promise<APIResponse> {
	return internal.sendTransactionalMail.call(body);
}
