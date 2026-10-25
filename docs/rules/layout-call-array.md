# arch/layout-call-array

One element per line in a single-line array passed to one of `callees`.

```ts
// ❌
await Promise.all([loadUser(), loadTeam()])

// ✅
await Promise.all([
  loadUser(),
  loadTeam(),
])
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `callees` | `string[]` | `['Promise.all', 'Promise.allSettled']` | Dotted callee names to check |
| `minElements` | `number` | `2` | Smallest array that must break |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

```ts
'arch/layout-call-array': ['error', { callees: ['Promise.all', 'Promise.allSettled', 'Promise.race'] }]
```
