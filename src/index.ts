import { ImplementInterface } from '@ajs/core/1';
import { setConfig } from './sendinblue';

export async function construct(config: any): Promise<void> {
	setConfig(config);
	await ImplementInterface(import('@ajs.local/sendinblue/dev'), import('./implementations/sendinblue/dev'));
}

export function destroy(): void {}

export function start(): void {}

export function stop(): void {}
