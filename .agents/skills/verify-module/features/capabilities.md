---
covers:
  - src/index.ts
  - src/implementations/email/index.ts
docs:
  - README.md
journeys:
  - capabilities
---

# Capabilities

`GetCapabilities` tells consumers what the Brevo provider supports.

## Sub-features

- `capabilities`: the provider name and the exact feature flags.

## How to get to it (user POV)

- `GetCapabilities()` of `@antelopejs/interface-email`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" capabilities
```

## Gotchas

- None.
