# brevo

The AntelopeJS module that implements `@antelopejs/interface-email` on the Brevo HTTP API, published as `@antelopejs/brevo`. `src/index.ts` holds the module lifecycle and registers the implementation; the Brevo client and config live in `src/implementations/email/client.ts`, the interface functions in `src/implementations/email/index.ts`.

## Versioning

The `@antelopejs/interface-core` and `@antelopejs/interface-email` ranges appear in `package.json`, `playground/package.json`, and the compatibility table in `README.md`; when you change a minimum, change all three together. Every `@antelopejs/*` range stops below the next minor of its floor: `>=0.5.1 <0.6.0` on a 0.x package, `~1.23.3` on a 1.x one. The `dependency:ranges` step of `pnpm run checks` enforces it in every tracked `package.json`.

## Tests

- `pnpm test` builds `dist`, then runs `ajs module test .` through `dotenv`. `src/test/antelope.test.ts` (`antelopeJs.test` in `package.json`) describes the test project; the suites in `src/test` run compiled from `dist/test`. They stub axios with sinon, so they need no Brevo API key and send no email.
- `playground/` is a pnpm workspace package used by `pnpm dev` (`ajs project dev` with variables from `.env`). On start it sends a real email to `TEST_EMAIL` with `BREVO_API_KEY` (both listed in `.env.exemple`). `pnpm run checks` and CI never run it.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

CI runs `pnpm run checks` in full on every pull request and reports what failed. The commit hook formats and lints the staged files. Locally, check only what you touched, one test file and not the suite, as the [`verify-changes`](.agents/skills/verify-changes/SKILL.md) skill says.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

### Suppressions

`guardrails.suppressions.json` caps lint directives, `@ts-expect-error`, `SAFETY:` comments and rules a lint config turns off. Over a cap, fix the code or remove another suppression of that kind; only the operator raises a number. After removing suppressions, run `pnpm run suppressions:update` and commit the file.

<!-- antelopejs-guardrails:end -->
