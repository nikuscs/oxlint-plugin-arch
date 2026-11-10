# arch/layout-object

One property per line once a single-line object has `min` properties. With `join`, a split object with fewer than `min` properties goes back on one line.

The fix changes only whitespace and preserves whether a trailing comma is present.

```ts
// ❌
save({ id, name, email })

// ✅
save({
  id,
  name,
  email,
})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `3` | Smallest object that must break |
| `scope` | `'call-args' \| 'all'` | `'call-args'` | Only call arguments, or every object |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |
| `join` | `{ max, keep? }` | | A split object with fewer than `min` properties goes on one line when it fits in `max` columns, every property is one line and none holds an object, array or function, and it has no comments. `keep` lists callees whose object arguments stay split; a name matches the whole callee (`z.object`) or its last part (`object`) |

`join` follows `scope`. Its fix keeps commas as written, so pair it with `comma-dangle`.

```ts
// ❌ join
save({
  id,
  name,
})

// ✅ join
save({ id, name })
```

```ts
'arch/layout-object': ['error', { min: 3, scope: 'all' }]
'arch/layout-object': ['error', { min: 3, join: { max: 160, keep: ['object', 'strictObject', 'looseObject'] } }]
```
