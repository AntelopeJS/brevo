import { internal } from '@ajs.local/sendinblue/dev';
import { SendinblueHandler } from './sendinblue';

let sendinblue: SendinblueHandler;

export async function construct(config: any): Promise<void> {
	sendinblue = new SendinblueHandler(config);
}

export function destroy(): void {}

export function start(): void {
	internal.sendTransactionalMail.onCall((body) => sendinblue.sendTransactionalMail(body));
}

export function stop(): void {
	internal.sendTransactionalMail.detach();
}
