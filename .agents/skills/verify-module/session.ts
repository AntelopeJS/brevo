import { fileURLToPath } from "node:url";

import {
  equal,
  type App,
  type CallResult,
  type Check,
  type HttpResult,
  type JourneyContext,
} from "@antelopejs/tooling-configs/verify";

import { startBrevoApi, type BrevoApi } from "./brevo-api.ts";
import { canonical, type Json } from "./json.ts";

export { pick, tuple, type Json } from "./json.ts";
export type ModuleConfig = NonNullable<NonNullable<Parameters<JourneyContext["fixture"]>[0]>["moduleConfig"]>;

const STAND_IN = fileURLToPath(new URL("./stand-in.ts", import.meta.url));

export const SENDER = { email: "sender@verify.test", name: "Verify" };
export const API_KEY = "verify-key";

export const BASE_CONFIG: ModuleConfig = { apiKey: API_KEY, defaultSender: SENDER };

export interface Session {
  context: JourneyContext;
  api: BrevoApi;
  app: App;
}

/** Starts the stand-in for api.brevo.com, loads the module in `ajs project dev` with the stand-in preloaded, and hands both to `run`. */
export async function withSession(
  context: JourneyContext,
  moduleConfig: ModuleConfig,
  run: (session: Session) => Promise<void>,
): Promise<void> {
  const api = await startBrevoApi();
  try {
    const project = context.fixture({ moduleConfig });
    const app = await context.dev("ajs-project-dev", project, {
      env: { NODE_OPTIONS: `--import ${STAND_IN}`, VERIFY_BREVO_PORT: String(api.port) },
    });
    await run({ context, api, app });
  } finally {
    await api.close();
  }
}

export function call(session: Session, name: string, path: string, args: Json[]): Promise<CallResult> {
  return session.context.call(name, session.app, { path: [path], args });
}

export interface Seen {
  result: HttpResult;
  entries: Json[];
}

/** Reads the requests the stand-in recorded so far, through the stand-in's own `/__log` endpoint. */
export async function requestsSeen(session: Session, name: string): Promise<Seen> {
  const result = await session.context.http(name, `${session.api.url}/__log`);
  return { result, entries: Array.isArray(result.json) ? result.json : [] };
}

/** `equal` that ignores key order; an absent value reads as `null`. */
export function same(name: string, actual: Json | undefined, expected: Json): Check {
  return equal(name, canonical(actual), canonical(expected));
}

/** The length of an array value, or -1 when the value is not an array. */
export function size(value: Json | undefined): number {
  return Array.isArray(value) ? value.length : -1;
}

/** The checks every module answer carries: the call itself returned. */
export function answered(result: CallResult): Check {
  return { name: "the call through core answered", pass: result.ok, detail: result.ok ? "ok" : `${result.error ?? result.body}` };
}
