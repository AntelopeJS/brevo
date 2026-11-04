---
covers:
  - src/implementations/email/batch.ts
docs:
  - README.md
journeys:
  - batch-maps-messages
  - batch-chunks
  - batch-error-handling
  - batch-missing-sender
  - batch-whitelist
---

# Batch

`SendBatch` sends many messages in requests of at most 1000 versions and answers each message.

## Sub-features

- `batch-maps-messages`: defaults become the shared fields, each message one version, each answer keeps its index, batch id, recipient and Brevo message id.
- `batch-chunks`: 1001 messages make two requests.
- `batch-error-handling`: a failing chunk fails its own messages with Brevo's code; `continueOnError: false` stops after it, the default goes on.
- `batch-missing-sender`: no sender fails every message with `MISSING_SENDER` and sends nothing.
- `batch-whitelist`: messages the whitelist empties count as successful and are not sent.

## How to get to it (user POV)

- `SendBatch({ messages, defaults, continueOnError })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" batch
```

## Gotchas

- `total` counts every message while `responses` of a stopped batch list only the chunks that were attempted.
