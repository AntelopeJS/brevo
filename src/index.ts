import { ImplementInterface } from "@antelopejs/interface-core";

import {
  type EmailClientConfig,
  setConfig,
} from "./implementations/email/client";

export async function construct(config: EmailClientConfig): Promise<void> {
  setConfig(config);

  void ImplementInterface(
    await import("@antelopejs/interface-email"),
    await import("./implementations/email"),
  );
}

export function destroy(): void {}

export function start(): void {}

export function stop(): void {}
