---
covers:
  - src/implementations/email/template.ts
docs:
  - README.md
journeys:
  - inline-template
  - provider-template
  - invalid-template-id
---

# Templates

`SendTemplate` sends either an inline template rendered by the module or a Brevo template referenced by id.

## Sub-features

- `inline-template`: every `{{ variable }}` occurrence is replaced (numbers written out); an html template is sent as html content and a text template as text content.
- `provider-template`: the id becomes a numeric `templateId` and the variables become `params`; a missing subject is an empty string.
- `invalid-template-id`: an id that is not a number answers `INVALID_TEMPLATE_ID` and sends nothing.

## How to get to it (user POV)

- `SendTemplate({ to, template: { id } | { type, content }, variables })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" templates
```

## Gotchas

- Brevo renders provider templates itself, so what the template looks like is outside every journey.
