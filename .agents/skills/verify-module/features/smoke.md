---
covers:
docs:
  - README.md
journeys:
  - module-dev
  - send-through-stand-in
  - live-contract
---

# Smoke

The fixed journey every verdict runs: load the module as `local`, send one message through core and see it reach the Brevo API.

## Sub-features

- `module-dev` is the pack's journey: the project answers, the consumer loads the email interface, Ctrl+C exits 130.
- `send-through-stand-in`: one `Send` reaches `/v3/smtp/email` with the right recipient.
- `live-contract`: always NOT VERIFIED. The module hard-codes `https://api.brevo.com/v3` and Brevo offers no sandbox that drops a message, so no journey reaches the real API. Every verdict of this skill therefore reads NOT VERIFIED until a journey can run against a Brevo sandbox, never PASS.

## How to get to it (user POV)

- A project with `@antelopejs/brevo` and a module that imports `@antelopejs/interface-email`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
