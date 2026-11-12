# arch/code-mutable-state

A module-level `let`, or a `var` outside any function. `export let` counts. A `let` in a nested block, and any `var` inside a function, does not. `declare` declarations are skipped.

```ts
// ❌
let cache = new Map()

// ✅
const cache = new Map()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `kinds` | `('let' \| 'var')[]` | `['let', 'var']` | Declaration kinds to check |
| `allow` | `string \| string[]` | | Regex for binding names to allow, tested per name |

```ts
'arch/code-mutable-state': ['error', { allow: '^__' }]
'arch/code-mutable-state': ['error', { kinds: ['let'] }]
```
