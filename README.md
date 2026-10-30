# @antelopejs/brevo

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/brevo"><img alt="npm" src="https://img.shields.io/npm/v/@antelopejs/brevo?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@antelopejs/brevo?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="https://discord.gg/sjK28QHrA7"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000" alt="Discord"></a>
<a href="https://github.com/AntelopeJS/interface-email/tree/main/docs"><img src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000" alt="Documentation"></a>
</div>

The AntelopeJS Brevo module sends transactional email through the [Brevo](https://www.brevo.com) HTTP API. It implements the email interface so application modules can send messages without depending on the provider directly.

## Interfaces

| Interface                                                                      | Documentation                                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [`@antelopejs/interface-email`](https://github.com/AntelopeJS/interface-email) | [Email](https://github.com/AntelopeJS/interface-email/tree/main/docs) |

The module implements `Send`, `SendBatch`, `SendTemplate` and `GetCapabilities`. It supports plain text and HTML messages, batches, inline templates, Brevo template IDs, tags and scheduled sends. Attachments accept URLs, buffers or base64-encoded content; filesystem paths are not supported. Message metadata and priority are not supported.

## Install

```bash
ajs project modules add @antelopejs/brevo
```

The module ships no default configuration. Add a `config` block and supply a Brevo API key before starting the project.

## Configuration

Set `BREVO_API_KEY` in your runtime environment and configure a sender verified in your Brevo account. Do not commit the API key.

```typescript [antelope.config.ts]
import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "my-project",
  modules: {
    brevo: {
      source: {
        type: "package",
        package: "@antelopejs/brevo",
        version: "^0.0.6",
      },
      config: {
        apiKey: "",
        defaultSender: {
          email: "noreply@example.com",
          name: "My project",
        },
      },
    },
  },
  envOverrides: {
    BREVO_API_KEY: "modules.brevo.config.apiKey",
  },
});
```

| Key              | Description                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `apiKey`         | Required Brevo API key, supplied through `BREVO_API_KEY` in the example.                                                       |
| `defaultSender`  | Optional sender, `{ email, name? }`, used when a message has no `from`. Batch sends use `defaults.from` or this sender.        |
| `emailWhitelist` | Optional array of regular-expression strings applied to `to`, `cc` and `bcc`. An omitted or empty array allows all recipients. |

Without a message sender or `defaultSender`, sending returns a `MISSING_SENDER` error. To restrict development recipients, set `emailWhitelist` to an array such as `["@example\\.com$"]`.

> **Warning:** If filtering leaves no `to` recipients, the module skips the send and returns a successful response without a message ID, even if `cc` or `bcc` recipients remain. Do not treat this response as proof of delivery.

## Quick start

In the module that sends email, add the interface:

```bash
pnpm add @antelopejs/interface-email
```

Call `Send` after AntelopeJS loads the configured Brevo module:

```typescript
import { Send } from "@antelopejs/interface-email";

const result = await Send({
  to: "user@example.com",
  subject: "Welcome",
  text: "Your account is ready.",
  html: "<p>Your account is ready.</p>",
});
```

`result.success` indicates whether the API accepted the request, subject to the whitelist behavior above. A successful send has status `queued`, not a delivery confirmation; `result.error` describes a failure.

`SendTemplate` accepts inline templates with `{{variable}}` substitution or a Brevo template ID as a numeric string. Inline substitution does not escape HTML, so escape untrusted values before inserting them into HTML templates.

## Documentation

- [Email](https://github.com/AntelopeJS/interface-email/tree/main/docs): the `@antelopejs/interface-email` contract this module implements.
- [Configuration](https://framework.antelopejs.com/docs/concepts/configuration): module sources, `config` blocks and environment overrides.
- [Brevo transactional email API](https://developers.brevo.com/reference/sendtransacemail): provider requirements and API behavior.

## Compatibility

<!-- antelopejs-docs-compat:start -->

| Package                       | Supported        | Tested with |
| ----------------------------- | ---------------- | ----------- |
| `@antelopejs/interface-core`  | `>=0.2.4 <1.0.0` | `0.2.4`     |
| `@antelopejs/interface-email` | `>=0.1.0 <0.2.0` | `0.1.0`     |

<!-- antelopejs-docs-compat:end -->

| Package                       | Supported range  |
| ----------------------------- | ---------------- |
| `@antelopejs/interface-email` | `>=0.1.0 <0.2.0` |
| `@antelopejs/interface-core`  | `>=0.2.4 <1.0.0` |

The module is developed and tested against `@antelopejs/core` `^1.16.0` on Node.js 24, with `axios` `^1.13.6`.

## Contributing

Use Node.js 24 and the pnpm version declared in `package.json`:

```bash
pnpm install --frozen-lockfile
pnpm prepack
pnpm lint
pnpm format:check
pnpm knip
pnpm typecheck
pnpm test
```

Tests mock HTTP requests and do not require a Brevo API key or send real email. Read the [contribution guidelines](CONTRIBUTING.md) before opening a pull request.

## License

[Apache-2.0](LICENSE)
