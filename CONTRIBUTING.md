# Contributing to AntelopeJS

Thank you for helping improve AntelopeJS.

## Before you start

- Search existing issues and discussions before opening a new one.
- Use an issue to discuss substantial features or behavior changes first.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development

Use the prerequisites and commands in the [README](README.md).

1. Fork or clone the repository.
2. Create a focused branch from the default branch.
3. Install dependencies with the lockfile intact.
4. Make the smallest change that solves the problem.
5. Run the repository's formatting, linting, type-checking and test commands.
6. Add or update documentation and tests when behavior changes.

Do not commit generated artifacts, credentials or unrelated formatting changes unless the repository explicitly requires them.

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit and pull request titles, for example `fix(email): handle an empty response`.

Pull requests should:

- Explain the problem and the chosen solution.
- Link the relevant issue or discussion.
- Call out breaking changes and migration steps.
- Include evidence that the change was tested.
- Remain small enough to review safely.

AntelopeJS repositories normally squash pull requests, so the pull request title becomes the commit on the default branch.

## Releases

Maintainers publish from GitHub Actions. Stable releases (`latest`) come from the default branch and prereleases (`next`) come from a branch named `next`. See the organization-wide [release channels](https://github.com/AntelopeJS/.github/blob/main/CONTRIBUTING.md#release-channels) guide for the full workflow.
