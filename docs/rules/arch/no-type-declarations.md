# `arch/no-type-declarations`

Rejects type aliases and interfaces in matched files so types live in one place.

## Why

Service and API modules should import named types, not declare them. Keep aliases and interfaces in type modules.

## Examples

❌ Incorrect

```ts
// src/api/accounts.ts
interface KfcProposal {}
export function listAccounts() {
  return []
}

type DraftStatus = {}
```

✅ Correct

```ts
export function listAccounts() {
  return []
}
```

With `allowPattern`:

```ts
// allowPattern: ['(Service|Deps)$', '^= ReturnType<typeof ']
export type AiRetry = ReturnType<typeof makeAiRetry>
export interface OrderDeps {
  db: Database
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowPattern` | `string` or `string[]` | none | Keep a declaration whose name matches. A pattern that starts with `=` or `^=` matches a type alias's value instead: `= ` followed by the value source text, without surrounding parentheses or comments. Interfaces have no value, so only name patterns apply to them. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-type-declarations': ['error', { allowPattern: ['ErrorKind$', '^= ReturnType<typeof '] }],
}
```

## Preset

Preset: `typePlacement` policy, on app files except `types/**`, colocated type files, components, hooks, services, UI, and tests; also on `**/*.{utils,constants}.ts` except UI and tests.

## Related

- [`arch/no-inline-types`](./no-inline-types.md)
- [`arch/no-runtime-in-types`](./no-runtime-in-types.md)
