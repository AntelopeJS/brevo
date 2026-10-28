# brevo

The AntelopeJS module that implements `@antelopejs/interface-email` on the Brevo HTTP API, published as `@antelopejs/brevo`. `src/index.ts` holds the module lifecycle and registers the implementation; the Brevo client and config live in `src/implementations/email/client.ts`, the interface functions in `src/implementations/email/index.ts`.

## Versioning

The `@antelopejs/interface-core` and `@antelopejs/interface-email` ranges appear in `package.json`, `playground/package.json`, and the compatibility table in `README.md`; when you change a minimum, change all three together. `interface-core` is consumed, so `>=minimum <1.0.0` is right for it. This package implements `interface-email` (`antelopeJs.implements`), so while that interface is 0.x its range in `package.json` and `README.md` stops below the next minor (`>=0.1.0 <0.2.0`). The playground only consumes it, so its range keeps `<1.0.0`. `pnpm run lint` runs `antelopejs-check-interface-ranges`, which enforces both bounds.

## Tests

- `pnpm test` builds `dist`, then runs `ajs module test .` through `dotenv`. `src/test/antelope.test.ts` (`antelopeJs.test` in `package.json`) describes the test project; the suites in `src/test` run compiled from `dist/test`. They stub axios with sinon, so they need no Brevo API key and send no email.
- `playground/` is a pnpm workspace package used by `pnpm dev` (`ajs project dev` with variables from `.env`). On start it sends a real email to `TEST_EMAIL` with `BREVO_API_KEY` (both listed in `.env.exemple`). `pnpm run checks` and CI never run it.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Finish every change with `pnpm run checks`. It runs typecheck, lint, format, knip, tests, size, ratchet, and sync, and prints only what failed. The change is done when it prints no failure.

The tools enforce most rules, listed in the table at the end. The sections below hold the rules no tool checks.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### Debt

`guardrails.ratchet.json` records the lint findings and oversize files this repository already had. Its numbers only go down. After you remove debt, run `pnpm run ratchet:update` and commit the lowered file. A rule listed there is off for `oxlint`. The ratchet counts it instead, and the pre-commit hook rejects it on every line you add.

### What enforces what

| Rule                                                                           | Enforced by                               |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| Formatting                                                                     | oxfmt                                     |
| Lint findings are errors; no rule warns                                        | oxlint preset                             |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                  |
| Every test asserts                                                             | `antelopejs/require-assertion`            |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`          |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`  |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test` |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`       |
| Files ≤ 20,000 bytes, tests included                                           | `antelopejs-check-size` (pre-commit)      |
| Existing debt only shrinks                                                     | `antelopejs-ratchet`                      |
| Types check                                                                    | `tsc` (pre-push)                          |
| No dead files, exports, or dependencies                                        | knip                                      |
| Managed files match the pack                                                   | `antelopejs-sync --check`                 |
| A test names the wrong implementation it catches                               | review; no tool                           |

<!-- antelopejs-guardrails:end -->
