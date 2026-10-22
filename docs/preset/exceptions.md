# Exceptions

Allow one file without turning a rule off everywhere. Back to the [preset overview](README.md).

| Need | Use |
| --- | --- |
| One rule off for some files | `ruleExclusions` |
| Whole file not linted | `ignorePatterns` |
| Type file outside `types/` | `modules.colocatedTypeFiles` |
| Migration with `up`/`down` exports | `modules.migrationFiles` |
| One line | inline disable with a reason |
| Change a rule group | [policies](policies.md) |

## `ruleExclusions`

```ts
ruleExclusions: {
  'arch/no-trivial-functions': ['apps/web/src/services/adapter.client.ts'],
  'modules/service-types': ['apps/server/src/services/portable-parser.ts'],
},
ignorePatterns: ['vendor/**'],
```

Turns the rule off in those files, in every scope that enables it.

## Type files next to their code

```ts
modules: { colocatedTypeFiles: ['apps/worker/src/*.types.ts'] }
```

- Listed files may declare types and build schemas, like backend `types/` files.
- They are not reported as misplaced. Top-level functions stay banned.
- Nothing is colocated by default.

## Migrations

```ts
modules: { migrationFiles: ['apps/server/src/services/database/migrations/**/*.ts'] }
```

- Skips folder-depth and service-function/inline-signature checks.
- Every other rule still applies. This is not an ignore.
- `unknown` or framework type exceptions still need their own `ruleExclusions`.

## Inline disables

```ts
// oxlint-disable-next-line arch/no-comments -- generated banner
```

Name the rule and give a reason after `--`.
