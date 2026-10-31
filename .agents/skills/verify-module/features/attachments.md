---
covers:
  - src/implementations/email/message.ts
docs:
  - README.md
journeys:
  - attachment-mapping
---

# Attachments

Attachments are mapped to Brevo's `attachment` field: a URL stays a URL and base64 content stays base64.

## Sub-features

- `attachment-mapping`: a url attachment and a base64 attachment are sent; a `path` attachment is logged and dropped, and a list with only paths sends no `attachment` field.

## How to get to it (user POV)

- `Send({ ..., attachments: [{ filename, url } | { filename, content, encoding: "base64" }] })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" attachments
```

## Gotchas

- A `Buffer` attachment cannot cross the JSON call of the harness, so buffers are not driven; they use the same base64 mapping as a base64 attachment.
