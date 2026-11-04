---
covers:
  - src/implementations/email/index.ts
  - src/implementations/email/message.ts
  - src/implementations/email/responses.ts
  - src/implementations/email/client.ts
docs:
  - README.md
journeys:
  - send-maps-message
  - api-error-mapping
  - missing-sender
  - network-failure
---

# Send

An application module calls `Send` of the email interface; the module turns it into one Brevo transactional request (`POST /v3/smtp/email`) and maps Brevo's answer back.

## Sub-features

- `send-maps-message`: to, cc, bcc, replyTo, subject, html, text, tags and a schedule reach Brevo as the documented fields, with the configured api key and the default sender; the answer is `queued` with Brevo's message id.
- `api-error-mapping`: a 400 answers failed with Brevo's own code and message and is not retryable; an empty 503 answers `API_ERROR` / `HTTP 503` and is retryable.
- `missing-sender`: with no `defaultSender` and no `from`, nothing is sent and the answer is `MISSING_SENDER`; a `from` address becomes the sender.
- `network-failure`: when Brevo cannot be reached the answer is a retryable `SEND_FAILED`.

## How to get to it (user POV)

- A module that imports `@antelopejs/interface-email` and calls `Send({ to, subject, html | text, ... })`; the project config holds `apiKey` and `defaultSender` for the brevo module.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" send
```

## Gotchas

- Brevo is stood in for by `brevo-api.ts`, a local HTTP server that `stand-in.ts` points the module's requests at through `NODE_OPTIONS`. Journeys read the requests it recorded through its `/__log` endpoint. No journey reaches the real Brevo, see [live-contract](live-contract.md).
