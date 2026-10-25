# arch/layout-call-arguments

One argument per line once a single-line call or `new` has `min` arguments.

The fix changes only whitespace and preserves whether a trailing comma is present.

```ts
// ❌
createUser(id, name, email)

// ✅
createUser(
  id,
  name,
  email,
)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `3` | Smallest call that must break |
| `indent` | `number` | `2` | Spaces per indent level for the fix |

```ts
'arch/layout-call-arguments': ['error', { min: 3 }]
```
