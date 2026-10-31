---
covers:
  - src/implementations/email/client.ts
docs:
  - README.md
journeys:
  - live-contract
---

# Live contract

What only the real Brevo API can show: that the requests the module builds are accepted by `https://api.brevo.com/v3`.

## Sub-features

- `live-contract`: always NOT VERIFIED. The module hard-codes `https://api.brevo.com/v3` and Brevo offers no sandbox that drops a message, so no journey reaches the real API. A verdict that requires this feature therefore reads NOT VERIFIED, never PASS, until a journey can run against a Brevo sandbox. The smoke feature leaves it out so a diff that touches no Brevo code is judged on the stand-in journeys.

## How to get to it (user POV)

- A project with `@antelopejs/brevo` and a module that imports `@antelopejs/interface-email`, sending through the real API key.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" live-contract
```

## Gotchas

- The stand-in journeys of the other features stand for Brevo's documented answers, not for its live behaviour.
