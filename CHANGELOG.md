# Changelog

## v0.0.12

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.11...v0.0.12)

### 🩹 Fixes

- **playground:** Require stable interface-email range ([#80](https://github.com/AntelopeJS/brevo/pull/80))

### 📦 Build

- Bump tooling-configs to 0.10.7 and pnpm to 10.34.9 ([#83](https://github.com/AntelopeJS/brevo/pull/83))
- **ci:** Bump tooling-configs to 0.10.12 and sync ([#86](https://github.com/AntelopeJS/brevo/pull/86))
- **deps:** Bump tooling-configs to 0.10.14 and sync ([#89](https://github.com/AntelopeJS/brevo/pull/89))

### 🏡 Chore

- **deps:** Update dependency @antelopejs/core to ~1.24.0 ([#81](https://github.com/AntelopeJS/brevo/pull/81))
- **deps:** Update dependency @types/node to v20.19.43 ([#82](https://github.com/AntelopeJS/brevo/pull/82))
- **deps:** Update dependency axios to v1.21.1 ([#84](https://github.com/AntelopeJS/brevo/pull/84))
- **deps:** Update dependency dotenv-cli to v11.1.0 ([#85](https://github.com/AntelopeJS/brevo/pull/85))
- **deps:** Update antelopejs tooling configs ([#79](https://github.com/AntelopeJS/brevo/pull/79))
- **deps:** Update dependency @antelopejs/core to v1.24.9 ([#87](https://github.com/AntelopeJS/brevo/pull/87))

### ❤️ Contributors

- Antony Rizzitelli

## v0.0.11

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.10...v0.0.11)

### 🩹 Fixes

- **email:** Render inline templates with renderInlineTemplate ([#75](https://github.com/AntelopeJS/brevo/pull/75))
- **deps:** Depend on the stable @antelopejs/interface-email

### 🏡 Chore

- **deps:** Update dependency oxlint-tsgolint to v7.0.2008 ([#77](https://github.com/AntelopeJS/brevo/pull/77))
- **deps:** Update dependency rimraf to v6.1.4 ([#78](https://github.com/AntelopeJS/brevo/pull/78))

### 🤖 CI

- Roll out trunk CI with merge queue ([#71](https://github.com/AntelopeJS/brevo/pull/71))
- Re-sync the AntelopeJS pack for the release app ([#73](https://github.com/AntelopeJS/brevo/pull/73))
- Stop forwarding the retired RELEASE_GITHUB_TOKEN ([#74](https://github.com/AntelopeJS/brevo/pull/74))

### ❤️ Contributors

- Antony Rizzitelli

## v0.0.10

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.9...v0.0.10)

### 📖 Documentation

- **readme:** Adopt the AntelopeJS framework README style ([#64](https://github.com/AntelopeJS/brevo/pull/64))
- **readme:** Range the config example on the current 0.0.9 release ([#65](https://github.com/AntelopeJS/brevo/pull/65))

### 📦 Build

- **deps:** Move to tooling-configs 0.7.1 and cap @antelopejs ranges below the next minor ([#67](https://github.com/AntelopeJS/brevo/pull/67))
- Move to @antelopejs/tooling-configs 0.8 and the three-tier CI ([#68](https://github.com/AntelopeJS/brevo/pull/68))

### 🤖 CI

- Run the check and test jobs on Windows too ([#66](https://github.com/AntelopeJS/brevo/pull/66))

### ❤️ Contributors

- Antony Rizzitelli

## v0.0.9

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.8...v0.0.9)

### 🔥 Performance

- **email:** Send batch defaults content once instead of in every message version ([#63](https://github.com/AntelopeJS/brevo/pull/63))

### 📦 Build

- **deps:** Bump @antelopejs/tooling-configs to 0.5.0 ([#61](https://github.com/AntelopeJS/brevo/pull/61))
- **deps:** Bump @antelopejs/tooling-configs to 0.5.1 ([#62](https://github.com/AntelopeJS/brevo/pull/62))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.8

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.7...v0.0.8)

### 🩹 Fixes

- **verify:** Cover every source file a feature's journeys run ([#52](https://github.com/AntelopeJS/brevo/pull/52))
- **email:** Substitute template variables literally ([#54](https://github.com/AntelopeJS/brevo/pull/54))
- **email:** Return SEND_TEMPLATE_FAILED when SendTemplate fails ([#53](https://github.com/AntelopeJS/brevo/pull/53))
- **email:** Report a 429 response as retryable ([#56](https://github.com/AntelopeJS/brevo/pull/56))
- **email:** Fail SendBatch messages on an invalid whitelist pattern ([#57](https://github.com/AntelopeJS/brevo/pull/57))
- **email:** Reject provider template ids that are not whole decimals ([#55](https://github.com/AntelopeJS/brevo/pull/55))
- **email:** Report tracking and inline attachments as unsupported ([#59](https://github.com/AntelopeJS/brevo/pull/59))
- **email:** Report provider template support for interface-email 0.2.0 ([#60](https://github.com/AntelopeJS/brevo/pull/60))

### 📖 Documentation

- **readme:** Link the package to AntelopeJS and AntelopeJS DMS ([553ab2c](https://github.com/AntelopeJS/brevo/commit/553ab2c))

### 📦 Build

- **deps:** Bump @antelopejs packages to the 2026-11-06 releases ([#50](https://github.com/AntelopeJS/brevo/pull/50))
- **deps:** Bump @antelopejs/tooling-configs to 0.3.4 ([#51](https://github.com/AntelopeJS/brevo/pull/51))
- **deps:** Bump @antelopejs/tooling-configs to 0.4.0 ([#58](https://github.com/AntelopeJS/brevo/pull/58))

### 🏡 Chore

- **verify:** Remove seeded runs from the verification skill ([#47](https://github.com/AntelopeJS/brevo/pull/47))
- **ci:** Remove the weekly mutation caller ([#48](https://github.com/AntelopeJS/brevo/pull/48))

### 🤖 CI

- Call ci-node.yml@v1 ([#49](https://github.com/AntelopeJS/brevo/pull/49))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.7

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.6...v0.0.7)

### 🩹 Fixes

- Cap the implemented interface-email range below the next minor ([#26](https://github.com/AntelopeJS/brevo/pull/26))

### 💅 Refactors

- Clean the repo with the guardrail pack ([#32](https://github.com/AntelopeJS/brevo/pull/32))
- **email:** Type template values as JsonValue and narrow them with guards ([#34](https://github.com/AntelopeJS/brevo/pull/34))

### 📖 Documentation

- **readme:** Use one Discord invite ([#39](https://github.com/AntelopeJS/brevo/pull/39))
- **github:** Send questions and ideas to Discord ([#40](https://github.com/AntelopeJS/brevo/pull/40))

### 📦 Build

- **deps:** Adopt @antelopejs/interface-email 0.1.0 ([#27](https://github.com/AntelopeJS/brevo/pull/27))
- **deps:** Bump @antelopejs/tooling-configs to 0.2.17 ([#35](https://github.com/AntelopeJS/brevo/pull/35))

### 🏡 Chore

- Adopt the guardrail pack from tooling-configs 0.2.0 ([#24](https://github.com/AntelopeJS/brevo/pull/24))
- Configure Renovate with the shared preset ([#25](https://github.com/AntelopeJS/brevo/pull/25))
- Land the cleanup campaign on main ([#45](https://github.com/AntelopeJS/brevo/pull/45))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.6

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.5...v0.0.6)

### 📖 Documentation

- **agents:** Simplify repository guidance ([#21](https://github.com/AntelopeJS/brevo/pull/21))
- Prepare brevo documentation for public release ([#23](https://github.com/AntelopeJS/brevo/pull/23))

### 🏡 Chore

- Replace Biome with oxlint, oxfmt and Knip ([#12](https://github.com/AntelopeJS/brevo/pull/12))
- Remove .git-blame-ignore-revs ([#14](https://github.com/AntelopeJS/brevo/pull/14))

### 🤖 CI

- Standardize npm releases ([#11](https://github.com/AntelopeJS/brevo/pull/11))
- Use shared npm release workflow ([#13](https://github.com/AntelopeJS/brevo/pull/13))
- **release:** Release next from a dedicated branch and restore requireCommits ([#15](https://github.com/AntelopeJS/brevo/pull/15))
- **release:** Reference the shared release workflows through v1 ([#16](https://github.com/AntelopeJS/brevo/pull/16))
- Pin the antelope core locally instead of installing it globally ([#17](https://github.com/AntelopeJS/brevo/pull/17))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>
- Thomas ([@Thomasims](http://github.com/Thomasims))

## v0.0.5

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.4...v0.0.5)

## v0.0.4

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.3...v0.0.4)

### 🏡 Chore

- Update dependencies ([f63cd0c](https://github.com/AntelopeJS/brevo/commit/f63cd0c))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>

## v0.0.3

[compare changes](https://github.com/AntelopeJS/brevo/compare/v0.0.2...v0.0.3)

### 🏡 Chore

- Switch to release-it-changelogen and remove publish:false ([2d293a8](https://github.com/AntelopeJS/brevo/commit/2d293a8))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
