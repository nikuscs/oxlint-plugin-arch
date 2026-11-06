# arch/layout-ternary

A ternary split across lines that fits in `max`, or a one-line ternary longer than `max`.

```ts
// ❌
const label = active
  ? 'On'
  : 'Off'

// ✅
const label = active ? 'On' : 'Off'
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `160` | Line length that forces a split before `?` and `:` |
| `indent` | `number` | `2` | Spaces per indent level for the fix |
| `fit` | `boolean` | `true` | Join or split the conditional to fit `max`; `false` turns that off |
| `branch` | `{ max }` | | Report a branch longer than `max` lines, and a `yield*` ternary with a multi-line operand |

```ts
'arch/layout-ternary': ['error', { max: 120 }]
'arch/layout-ternary': ['error', { fit: false, branch: { max: 3 } }]
```
