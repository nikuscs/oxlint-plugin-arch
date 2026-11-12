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
| `nested` | `boolean` | `false` | Also split a one-line object below `min` that holds a non-empty object or an inline function; only the outermost such object on a line reports, and it follows `scope`. Inside a ternary, or in a call followed by `.method(`, it reports without a fix: name the call first |
| `inner` | `number` | | Split a one-line object with `inner` or more entries that is a property value inside a split object. Each fix pass reaches one level deeper, so it applies at every depth. Ignores `scope` |
| `siblings` | `boolean` | `false` | Split a one-line object argument when a call to the same callee in the same array has that argument split |
| `params` | `boolean` | `false` | Also split a destructured function parameter with `min` properties on one line; its type annotation is ignored. Ignores `scope` |
| `join` | `{ max, keep? }` | | A split object with fewer than `min` properties goes on one line when it fits in `max` columns, every property is a one-line `key: value`, shorthand or spread, and none holds an object, array or function (a method or getter also keeps it split), and it has no comments. `keep` lists callees whose object arguments stay split; a name matches the whole callee (`z.object`) or its last part (`object`) |

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
// ❌ params: true
function f({ a, b, c }: Props) {}

// ✅
function f({
  a,
  b,
  c,
}: Props) {}

// ❌ nested: true
save({ filter: { active: true } })

// ✅
save({
  filter: { active: true },
})

// ❌ inner: 2
const config = {
  retry: { times, delay },
  name,
}

// ✅
const config = {
  retry: {
    times,
    delay,
  },
  name,
}

// ❌ siblings: true
const fields = [
  field({
    a,
    b,
    c,
  }),
  field({ a }),
]

// ✅
const fields = [
  field({
    a,
    b,
    c,
  }),
  field({
    a,
  }),
]

// ❌ scope: 'all'
const user = { id, name, email }
```

```ts
'arch/layout-object': ['error', { min: 3, scope: 'all' }]
'arch/layout-object': ['error', { min: 3, params: true, nested: true, siblings: true, inner: 2 }]
'arch/layout-object': ['error', { min: 3, join: { max: 160, keep: ['object', 'strictObject', 'looseObject'] } }]
```
