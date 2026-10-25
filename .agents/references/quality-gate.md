# Quality gate

Review the changed files and their callers against `.agents/references/architecture.md`. Report a defect only when the code proves its effect.

## Checks

```sh
bun run check
```

`check` builds, self-lints with the repo's own preset, typechecks (examples and scripts too), runs fallow dead-code and dupes, and checks the generated README tables. It must exit 0 with no diagnostics.

Tests are paused during the refactor. For a behavior change, prove it: lint a small snippet with the built rule and show the diagnostics before and after.

## Review

- Every new or moved file matches the architecture tree and naming table.
- A rule change keeps its message text, option shapes and defaults unless the change is declared breaking in `CHANGELOG.md`.
- A changed rule or option updates `docs/rules/<rule>.md`; a changed group updates `docs/groups/<group>.md` and `docs/folders.md`.
- A preset change is proven on a real consumer: lint it before and after with an equivalent config and explain every diagnostic that differs.
- After a rename or removal, old IDs, exports, docs rows and changelog references are gone or listed as breaking.

## Protected enforcement

`architecture.md`, this file, `oxlint.config.ts`, `.fallowrc.json`, `tsconfig*.json`, `.github/workflows/**` and the package `check`, `lint` and `typecheck` scripts change only on an explicit user request. New suppressions and downgraded severities are findings.

Use `FAIL` for proven defects and convention violations, `WARN` for optional improvements. Include the file, line, effect and fix direction.
