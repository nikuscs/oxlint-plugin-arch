# arch/layout-ternary

A ternary split across lines that fits in `max`, or a one-line ternary longer than `max`. The width counts the whole line. A nested ternary, a multi-line operand or a comment skips this check. Inside a template literal a split ternary is always joined and a one-line ternary is never split.

```ts
// ❌
const label = active
  ? 'On'
  : 'Off'

// ✅
const label = active ? 'On' : 'Off'

// ❌ max: 40
const label = isActive ? 'Currently active' : 'Currently inactive'

// ✅
const label = isActive
  ? 'Currently active'
  : 'Currently inactive'

// ❌ branch: { max: 3 }
const view = ready
  ? render({
    a,
    b,
  })
  : null
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `160` | Line length that forces a split before `?` and `:` |
| `indent` | `number \| 'tab'` | `2` | Spaces per indent level for the fix, or `'tab'` |
| `fit` | `boolean` | `true` | Join or split the conditional to fit `max`; `false` turns that off |
| `branch` | `{ max }` | | Report a branch longer than `max` lines, and a `yield*` ternary with a multi-line operand (reported only when no branch is too long) |

```ts
'arch/layout-ternary': ['error', { max: 120 }]
'arch/layout-ternary': ['error', { fit: false, branch: { max: 3 } }]
```
