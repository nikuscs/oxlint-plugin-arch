# Release

Rename `## Unreleased` in `CHANGELOG.md` to the intended version and commit. Leave the package version unchanged; `bun run release:<patch|minor|major>` bumps it, commits, tags, and pushes from a clean, synchronized `main`. Default to `release:patch` (0.9.0 → 0.9.1 → 0.9.2); use minor or major only when the maintainer asks for it.

The `Release` workflow checks and packs the tagged source without publishing credentials. After environment approval, a fresh job verifies the package digest and publishes that same tarball with OIDC and lifecycle scripts disabled. A separate job creates the GitHub Release. Local npm login is not required. Get explicit release approval before running a release command or pushing a version tag.

If npm publication succeeds but the GitHub Release fails, create only the missing GitHub Release after approval; rerunning publication cannot publish the same version again.

One-time npm setup: in `oxlint-plugin-arch` package settings, add a GitHub Actions trusted publisher with owner `nikuscs`, repository `oxlint-plugin-arch`, workflow `release.yml`, environment `production`, and direct `npm publish` allowed. Configure the GitHub `production` environment to require maintainer approval and permit only `v*` tags. Verify setup before the first release; never add an npm publish token to GitHub secrets.
