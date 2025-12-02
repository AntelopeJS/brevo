import { ImplementInterface } from '@ajs/core/beta';
import { BrevoConfig, setConfig } from './brevo';
import { setConfig as setEmailConfig } from './implementations/email/beta/client';

export async function construct(config: BrevoConfig): Promise<void> {
  setConfig(config);
  setEmailConfig(config);

  void ImplementInterface(await import('@ajs.local/brevo/dev'), await import('./implementations/brevo/dev'));
  void ImplementInterface(await import('./interfaces/email/beta'), await import('./implementations/email/beta'));
}

export function destroy(): void {}

export function start(): void {}

export function stop(): void {}
