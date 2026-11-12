# arch/layout-call-arguments

One argument per line once a single-line call or `new` has `min` arguments.

The fix changes only whitespace and preserves whether a trailing comma is present. Incorrect layouts with comments or unsafe argument ranges (including parenthesized arguments) are reported without a fix. A call already split on every argument is left alone, and so is a call with a multi-line callback (`() => {…}` or `function () {…}`). A multi-line object, array or call argument still counts, and a partly split call is reflowed.

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
| `min` | `number` | `3` | Smallest call that must break (at least 2) |
| `indent` | `number \| 'tab'` | `2` | Spaces per indent level for the fix, or `'tab'` |
| `split` | `boolean` | `true` | The `min` check above; `false` turns it off |
| `pipe` | `{ min, methods? }` | | A one-line `.pipe(…)` or `Function.pipe(…)` with `min` steps puts each step on its own line, even while `split` is off; `min` here replaces the call `min` for pipes. `methods` (default `['pipe']`) names the pipe methods, also for the pipe skip in `hug` and `join`. With `pipe` set, `join` leaves every pipe as written |
| `hug` | `{ max }` | | A call with a multi-line argument puts every argument on its own line, unless a last callback, object or array hugs the call after one-line arguments. A split call that could hug in `max` columns is reported too |
| `join` | `{ max, nesting?, items?, keep? }` | | A split call or parameter list of up to `items` one-line items (default `2`, and always fewer than `min` while `split` is on) that fits in `max` columns goes on one line. `nesting` skips calls nested deeper; `keep` lists callee texts to leave split; each must equal the whole callee, such as `Layer.mergeAll`, a last part does not match |

`join` skips a `.pipe(…)` with several steps. `hug` never lets a pipe hug: a pipe with a multi-line step puts every step on its own line. Their fixes change only whitespace and keep commas as written, so pair them with `comma-dangle`.

```ts
// ❌ hug: a call that cannot hug
run(id, load(
  user,
))

// ✅ hug
run(
  id,
  load(
    user,
  ),
)

// ❌ hug: a split call that could hug
run(
  id,
  () => {
    load(user)
  },
)

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
'arch/layout-call-arguments': ['error', { split: false, pipe: { min: 3 } }]
'arch/layout-call-arguments': ['error', { split: false, join: { max: 140, items: 2, keep: ['Layer.mergeAll'] } }]
```
