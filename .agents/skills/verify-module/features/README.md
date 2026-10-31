# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, `journeys:` the journeys it runs, and `seeded-breaks/<feature>.patch` the break its journeys must catch. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered.

The module talks only to `https://api.brevo.com/v3`, which no journey can reach for real. Journeys run it against a local stand-in for that API (`brevo-api.ts`, redirected by `stand-in.ts`), and a verdict that requires `live-contract` reads NOT VERIFIED.

| Feature | What the user does | Journeys |
|---|---|---|
| [send](send.md) | An application module calls `Send` and gets Brevo's answer mapped. | send-maps-message, api-error-mapping, missing-sender, network-failure |
| [recipients](recipients.md) | The developer limits who can be mailed with `emailWhitelist`. | whitelist-filters, whitelist-all-filtered |
| [attachments](attachments.md) | A message carries url or base64 attachments. | attachment-mapping |
| [templates](templates.md) | A message is built from an inline template or a Brevo template id. | inline-template, provider-template, invalid-template-id |
| [batch](batch.md) | Many messages go out in chunks of 1000. | batch-maps-messages, batch-chunks, batch-error-handling, batch-missing-sender, batch-whitelist |
| [capabilities](capabilities.md) | A consumer asks what the provider supports. | capabilities |
| [live-contract](live-contract.md) | Sends through the real Brevo API. Always NOT VERIFIED. | live-contract |
| [smoke](smoke.md) | The fixed journey every verdict runs. | module-dev, send-through-stand-in |
