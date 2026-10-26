# Quality gate

Review the changed files and their callers against `.agents/references/architecture.md`. Report a defect only when the code proves its effect.

## Checks

```sh
bun run check
```

`check` builds, self-lints, runs the tests with the repo's own preset, typechecks (examples and scripts too), runs fallow dead-code and dupes, and checks the generated README tables. It must exit 0 with no diagnostics.

A new or changed rule must not show up near the top of `bun run bench <consumer repo>` without a reason.

`bun run test` runs every rule's rows. A behavior change adds or changes the row that proves it. Rows hold only data: `name`, `code`, and when needed `filename`, `files`, `options`, `output`, `errors`.

## Review

- Every new or moved file matches the architecture tree and naming table.
- A rule change keeps its message text, option shapes and defaults unless the change is declared breaking in `CHANGELOG.md`.
- A changed rule or option updates `docs/rules/<rule>.md`; a changed group updates `docs/groups/<group>.md` and `docs/folders.md`.
- A preset change is proven on a real consumer: lint it before and after with an equivalent config and explain every diagnostic that differs.
- After a rename or removal, old IDs, exports, docs rows and changelog references are gone or listed as breaking.

## Protected enforcement

`architecture.md`, this file, `oxlint.config.ts`, `.fallowrc.json`, `tsconfig*.json`, `.github/workflows/**` and the package `check`, `lint` and `typecheck` scripts change only on an explicit user request. New suppressions and downgraded severities are findings.

## Self-lint exceptions

`oxlint.config.ts` turns off five rules for this repository and raises `max-lines` to 600 for `tests/**/*.test.ts`, approved by the owner. Rules and the preset read untyped input (ESTree nodes, rule options, user configs), so runtime checks are their parsing step:

| Rule | Why it is off here |
| --- | --- |
| `dillon-anti-slop/no-runtime-typeof` | `typeof node.value === 'string'` is how a literal is read |
| `dillon-anti-slop/no-reflect-get` | the vendored rules inspect `Reflect` calls by shape |
| `dillon-anti-slop/no-unknown-parameters`, `arch/types-unknown` | parsers take `unknown` before narrowing it |
| `arch/code-literal-in` | `'key' in node` checks optional ESTree fields |
| `max-lines` 600 in `tests/**/*.test.ts` | a rule's test file is one `it.each` table of data rows; the full table stays in one file |

Any other suppression is a finding.

Use `FAIL` for proven defects and convention violations, `WARN` for optional improvements. Include the file, line, effect and fix direction.
