# arch/layout-ternary

A ternary split across lines that fits in `maxLength`, or a one-line ternary longer than `maxLength`.

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
| `maxLength` | `number` | `160` | Line length that forces a split before `?` and `:` |
| `indent` | `number` | `2` | Spaces per indent level for the fix |

```ts
'arch/layout-ternary': ['error', { maxLength: 120 }]
```
