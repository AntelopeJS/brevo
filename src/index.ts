import { ImplementInterface } from '@ajs/core/1';
import { setConfig } from './brevo';

export async function construct(config: any): Promise<void> {
	setConfig(config);
	await ImplementInterface(import('@ajs.local/brevo/dev'), import('./implementations/brevo/dev'));
}

export function destroy(): void {}

export function start(): void {}

export function stop(): void {}
