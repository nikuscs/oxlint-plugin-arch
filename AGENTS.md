# Repository guidance

## Rule design

- `src/` is the canonical plugin implementation; the published npm package is the only consumer install path.
- Keep every rule configurable and free of application-specific names, paths, and exceptions. Library names appear only as documented default option values.
- Keep consumer globs and project policy in the consumer's Oxlint config.
- Use Oxlint's ESTree API; do not add another production parser.
- Option changes to existing rules stay backward compatible: old shapes keep working and defaults keep today's behavior.
- Autofixes change only whitespace or remove comments. When a fix cannot be proven safe (comments in range, computed or sparse syntax), report without a fix.
- Reuse helpers in `src/utils/helpers/` before writing new ones (`astDottedName`, `comments*`, `layout*`). Every helper export starts with its helper module basename.
- `README.md` is for plugin users only; maintainer workflow lives here.

## Adding or changing a rule

1. Write `src/rules/<name>.ts` with a short doc comment: plain-English behavior plus a one-line example.
2. Add focused RuleTester coverage in `src/tests/<name>.test.ts`. Fixable rules need `output` for every fixable case, an idempotence case, and a comment-preservation case.
3. Register the rule in `src/index.ts`, keeping imports and entries alphabetical.
4. Add or update its row in the matching group table of `README.md` (mark fixable rules with 🔧). Option-heavy rules also get a section under "Rule details".
5. Add an entry to `examples/full.oxlint.config.ts`, and to `examples/monorepo.oxlint.config.ts` when it fits that layout.
6. Add a bullet under `## Unreleased` in `CHANGELOG.md`.

Done when `bun run check` passes and the rule appears in the registry, the README table, the full example, and the changelog.

## Release

Rename `## Unreleased` in `CHANGELOG.md` to the new version and commit, then run `bun run release:<patch|minor|major>` from a clean `main`.
