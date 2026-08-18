# Repository guidance

- `src/` is the canonical plugin implementation.
- The published npm package is the consumer install path; keep the skill vendor copy optional.
- Keep every rule configurable and free of application-specific names, paths, and exceptions.
- Keep consumer globs and project policy in the consumer's Oxlint config.
- Use Oxlint's ESTree API; do not add another production parser.
- Add focused RuleTester coverage for semantic changes.
- Every helper export starts with its helper module basename.
- Run `bun run sync:skill-assets` after changing production source.
- Run `bun run check` before committing.
