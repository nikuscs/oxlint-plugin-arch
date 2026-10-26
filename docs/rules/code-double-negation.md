# arch/code-double-negation

A `!!value` coercion.

```ts
// ❌
const hasUser = !!user

// ✅
const hasUser = user !== undefined
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | `'Use Boolean(value) or an explicit comparison.'` | Report text |

```ts
'arch/code-double-negation': 'error'
```
