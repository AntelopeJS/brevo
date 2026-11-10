import sinon from "sinon";
import assert from "node:assert";
import axios, { AxiosHeaders } from "axios";
import { SendBatch } from "@antelopejs/interface-email";

import { setConfig } from "../implementations/email/client";

function stubBatchRequest() {
  setConfig({ apiKey: "key", defaultSender: { email: "sender@example.com" } });
  return sinon.stub(axios, "request").resolves({
    status: 201,
    data: { messageIds: [] },
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe("SendBatch body", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("fails when every message version repeats the defaults content, and when an override is dropped", async () => {
    const request = stubBatchRequest();
    await SendBatch({
      defaults: { subject: "News", html: "<p>Shared</p>", text: "Shared" },
      messages: [
        { to: "a@example.com", subject: "News" },
        { to: "b@example.com", subject: "Custom", text: "Own" },
      ],
    });

    assert.deepStrictEqual(request.getCall(0).args[0].data, {
      sender: { email: "sender@example.com" },
      subject: "News",
      htmlContent: "<p>Shared</p>",
      textContent: "Shared",
      messageVersions: [
        { to: [{ email: "a@example.com" }] },
        {
          to: [{ email: "b@example.com" }],
          subject: "Custom",
          htmlContent: "<p>Shared</p>",
          textContent: "Own",
        },
      ],
    });
  });

  it("fails when versions without defaults lose their own content to the first message's", async () => {
    const request = stubBatchRequest();
    await SendBatch({
      messages: [
        { to: "a@example.com", subject: "One", html: "<p>1</p>" },
        { to: "b@example.com", subject: "Two", html: "<p>2</p>" },
      ],
    });

    assert.deepStrictEqual(request.getCall(0).args[0].data, {
      sender: { email: "sender@example.com" },
      subject: "One",
      htmlContent: "<p>1</p>",
      messageVersions: [
        {
          to: [{ email: "a@example.com" }],
          subject: "One",
          htmlContent: "<p>1</p>",
        },
        {
          to: [{ email: "b@example.com" }],
          subject: "Two",
          htmlContent: "<p>2</p>",
        },
      ],
    });
  });
});
