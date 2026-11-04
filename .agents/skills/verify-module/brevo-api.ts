import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { isRecord, parseJson, type Json } from "./json.ts";

/** One request the module sent to the stand-in for `https://api.brevo.com`. */
export interface Recorded {
  method: string;
  path: string;
  apiKey: string;
  body: Json;
}

export interface Scripted {
  status: number;
  body: Json;
}

/** The stand-in for the Brevo HTTP API: it records every request and answers from a queue, then with a default 201. */
export interface BrevoApi {
  port: number;
  url: string;
  reply(status: number, body: Json): void;
  close(): Promise<void>;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function versionCount(body: Json): number {
  if (!isRecord(body)) return 0;
  const versions = body.messageVersions;
  return Array.isArray(versions) ? versions.length : 0;
}

function defaultAnswer(sequence: number, body: Json): Scripted {
  const count = versionCount(body);
  if (count > 0) {
    return { status: 201, body: { messageIds: Array.from({ length: count }, (_, index) => `<batch-${sequence}-${index}@brevo.stand-in>`) } };
  }
  return { status: 201, body: { messageId: `<message-${sequence}@brevo.stand-in>` } };
}

function isAddress(address: ReturnType<Server["address"]>): address is AddressInfo {
  return address !== null && typeof address === "object";
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!isAddress(address)) {
        reject(new Error("the stand-in did not bind a TCP port"));
        return;
      }
      resolve(address.port);
    });
  });
}

/** Starts the stand-in on a free loopback port. `GET /__log` answers the recorded requests as JSON, the second view a journey reads through `context.http`. */
export async function startBrevoApi(): Promise<BrevoApi> {
  const log: Recorded[] = [];
  const queue: Scripted[] = [];
  const server = createServer((request, response) => {
    void readBody(request).then((text) => {
      if (request.url === "/__log") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(log));
        return;
      }
      const body = parseJson(text);
      log.push({ method: request.method ?? "", path: request.url ?? "", apiKey: String(request.headers["api-key"] ?? ""), body });
      const answer = queue.shift() ?? defaultAnswer(log.length, body);
      response.writeHead(answer.status, { "content-type": "application/json" });
      response.end(JSON.stringify(answer.body));
    });
  });
  const port = await listen(server);
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    reply: (status, body) => {
      queue.push({ status, body });
    },
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
