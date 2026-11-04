---
covers:
  - src/implementations/email/recipients.ts
docs:
  - README.md
journeys:
  - whitelist-filters
  - whitelist-all-filtered
---

# Recipients

`emailWhitelist` is a list of regular expressions. Only addresses that match one of them stay on a message, so a staging project cannot mail real customers.

## Sub-features

- `whitelist-filters`: unmatched to, cc and bcc addresses are removed before the request; a cc or bcc left empty is dropped.
- `whitelist-all-filtered`: when no `to` address survives, `Send` and `SendTemplate` answer success without a message id and Brevo receives nothing.

## How to get to it (user POV)

- `emailWhitelist: ["@example\\.com$"]` in the brevo module's config in `antelope.config.ts`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" recipients
```

## Gotchas

- The whitelist applies to batches too, see [batch](batch.md).
