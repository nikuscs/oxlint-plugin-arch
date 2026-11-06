# arch/code-function-nesting

Functions nested more than `max` deep, counting declarations, expressions and arrows. Only the first function past `max` reports.

```ts
// ❌
function a() { return () => () => () => () => 1 }

// ✅
const inner = () => () => 1
function a() { return () => inner }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `4` | Deepest nesting allowed |

```ts
'arch/code-function-nesting': ['error', { max: 4 }]
```
