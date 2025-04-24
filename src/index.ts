import { ImplementInterface } from '@ajs/core/beta';
import { BrevoConfig, setConfig } from './brevo';

export async function construct(config: BrevoConfig): Promise<void> {
  setConfig(config);
  await ImplementInterface(import('@ajs.local/brevo/dev'), import('./implementations/brevo/dev'));
}

export function destroy(): void {}

export function start(): void {}

export function stop(): void {}
