# arch/code-mutable-state

A module-level `let`, or a `var` outside any function.

```ts
// ❌
let cache = new Map()

// ✅
const cache = new Map()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `kinds` | `('let' \| 'var')[]` | `['let', 'var']` | Declaration kinds to check |
| `allowNamePattern` | `string \| string[]` | | Regex for binding names to allow |

```ts
'arch/code-mutable-state': ['error', { allowNamePattern: '^__' }]
```
