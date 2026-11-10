# arch/layout-call-arguments

One argument per line once a single-line call or `new` has `min` arguments.

The fix changes only whitespace and preserves whether a trailing comma is present. Incorrect layouts with comments or unsafe argument ranges (including parenthesized arguments) are reported without a fix. Already split calls and calls containing multiline callbacks are left alone.

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
| `indent` | `number \| 'tab'` | `2` | Spaces per indent level for the fix, or `'tab'` |
| `split` | `boolean` | `true` | The `min` check above; `false` turns it off |
| `hug` | `{ max }` | | A call with a multi-line argument puts every argument on its own line, unless a last callback, object or array hugs the call after one-line arguments. A split call that could hug in `max` columns is reported too |
| `join` | `{ max, nesting?, keep? }` | | A split call or parameter list of fewer than `min` one-line items (at most two with `split: false`) that fits in `max` columns goes on one line. `nesting` skips calls nested deeper; `keep` lists callees to leave split |

`hug` and `join` skip `.pipe(…)` calls with several steps. Their fixes change only whitespace and keep commas as written, so pair them with `comma-dangle`.

```ts
// ❌ hug
run(id, load(
  user,
))

// ✅ hug
run(id, () => {
  load(user)
})

// ❌ join
save(
  id,
)

// ✅ join
save(id)
```

```ts
'arch/layout-call-arguments': ['error', { min: 3 }]
'arch/layout-call-arguments': ['error', { split: false, hug: { max: 140 }, join: { max: 140, nesting: 2 } }]
```
