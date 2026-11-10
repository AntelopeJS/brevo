# Playground

A local AntelopeJS project that sends one real email through `@antelopejs/brevo` while you change it. `antelope.config.ts` loads two modules: `brevo` from the parent folder, with the sender `email-playground@antelopejs.com`, and `playground` from this folder.

## Run it

Set `BREVO_API_KEY` and `TEST_EMAIL`, in the environment or in a `.env` file at the repository root. Then run the project in watch mode from the repository root:

```bash
pnpm dev
```

`pnpm dev` runs `dotenv -- ajs project dev -w -p playground`. On start, the `playground` module calls `Send` with an HTML and a text body to `TEST_EMAIL`, and logs the message ID or the error. Without either variable, it logs an error and sends nothing.

## Compatibility

<!-- antelopejs-docs-compat:start -->

| Package                       | Supported        | Tested with |
| ----------------------------- | ---------------- | ----------- |
| `@antelopejs/interface-core`  | `>=0.2.4 <1.0.0` | `0.4.0`     |
| `@antelopejs/interface-email` | `>=0.2.0 <1.0.0` | `0.2.0`     |

<!-- antelopejs-docs-compat:end -->
