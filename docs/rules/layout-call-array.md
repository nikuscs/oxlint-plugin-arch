# arch/layout-call-array

One element per line in a single-line array passed to one of `callees`. Only the first argument is checked, and a local `Promise` binding is skipped.

The fix changes only whitespace and keeps a trailing comma as written. An array with a hole or a comment is reported without a fix.

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
| `callees` | `string[]` | `['Promise.all', 'Promise.allSettled']` | Dotted callee names to check. Replaces the default list; an empty list turns the rule off |
| `min` | `number` | `2` | Smallest array that must break (at least 1) |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

```ts
'arch/layout-call-array': ['error', { callees: ['Promise.all', 'Promise.allSettled', 'Promise.race'] }]
```
