import { request as httpRequest, type ClientRequest, type IncomingMessage, type RequestOptions } from "node:http";
import https from "node:https";

type Target = RequestOptions | string | URL;

function isOptions(target: Target): target is RequestOptions {
  return typeof target === "object" && !(target instanceof URL);
}

const port = Number(process.env.VERIFY_BREVO_PORT);

if (Number.isInteger(port) && port > 0) {
  const nativeRequest = https.request;
  const redirected = (target: Target, callback?: (response: IncomingMessage) => void): ClientRequest => {
    if (isOptions(target) && target.hostname === "api.brevo.com") {
      return httpRequest({ ...target, protocol: "http:", hostname: "127.0.0.1", host: "127.0.0.1", port, agent: false }, callback);
    }
    return nativeRequest(target, callback);
  };
  Object.defineProperty(https, "request", { value: redirected, configurable: true, writable: true });
}
