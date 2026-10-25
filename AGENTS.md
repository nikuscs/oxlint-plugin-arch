# Repository guidance

## Rule design

- `src/` is the canonical plugin implementation; the published npm package is the only consumer install path.
- Keep every rule configurable and free of application-specific names, paths, and exceptions. Library names appear only as documented default option values.
- Keep consumer globs and project policy in the consumer's Oxlint config.
- Use Oxlint's ESTree API; do not add another production parser.
- Option changes to existing rules stay backward compatible: old shapes keep working and defaults keep today's behavior.
- Autofixes change only whitespace or remove comments. When a fix cannot be proven safe (comments in range, computed or sparse syntax), report without a fix.
- Reuse helpers in `src/utils/*.utils.ts` before writing new ones. Every export starts with its file's topic (`astDottedName`, `sourceIsWhy`).

## Code

- The repo follows its own preset: `bun run lint` must pass. Types live in `src/types/<topic>.types.ts`.
- No comments. The only exception is an `oxlint-disable-next-line <rule> -- <reason>` directive where a rule truly cannot be satisfied.
- A function used once is inlined. It stays named only when inlining would break a lint limit (complexity, file length, nesting).
- No duplicate code: `bun run check` runs fallow dead-code and dupes. Logic two files share goes into `src/utils/`; a helper only one file uses stays in that file.
- `README.md` is a short landing page for plugin users: pitch, install, quick start and the rule index. Maintainer workflow lives here.

## Adding or changing a rule

1. Write `src/rules/<family>/<family>-<subject>.ts`. Its only export is `export const <camelCase of the ID> = defineRule(...)`; selector rules use `astSelectorRule` from `src/utils/ast.utils.ts`. Option types go in `src/types/<family>.types.ts`.
2. Tests are paused during the refactor (`feat/arch-refactor`); add one only when asked. Fixable rules that get tests need `output` for every fixable case, an idempotence case, and a comment-preservation case.
3. Register the rule in `src/index.ts`, keeping imports and entries alphabetical.
4. Add its row to the matching family in the `README.md` rule table (mark fixable rules with 🔧).
5. Add a bullet under `## Unreleased` in `CHANGELOG.md`.

Done when `bun run check` passes and the rule appears in the registry, the README table and the changelog.

## Release

Rename `## Unreleased` in `CHANGELOG.md` to the intended version and commit. Leave the package version unchanged; `bun run release:<patch|minor|major>` bumps it, commits, tags, and pushes from a clean, synchronized `main`. Default to `release:patch` (0.9.0 → 0.9.1 → 0.9.2); use minor or major only when the maintainer asks for it.

The `Release` workflow checks and packs the tagged source without publishing credentials. After environment approval, a fresh job verifies the package digest and publishes that same tarball with OIDC and lifecycle scripts disabled. A separate job creates the GitHub Release. Local npm login is not required. Get explicit release approval before running a release command or pushing a version tag.

If npm publication succeeds but the GitHub Release fails, create only the missing GitHub Release after approval; rerunning publication cannot publish the same version again.

One-time npm setup: in `oxlint-plugin-arch` package settings, add a GitHub Actions trusted publisher with owner `nikuscs`, repository `oxlint-plugin-arch`, workflow `release.yml`, environment `production`, and direct `npm publish` allowed. Configure the GitHub `production` environment to require maintainer approval and permit only `v*` tags. Verify setup before the first release; never add an npm publish token to GitHub secrets.
