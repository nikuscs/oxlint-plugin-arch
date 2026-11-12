# arch/effect-merge-pipe

A merge that spans lines is never piped: name it first, then pipe the name.

It reports a `methods` call such as `.pipe(` made directly on the merge, and the merge as the first argument of a data-first `pipe(...)`. A merge on one line may still be piped.

```ts
// ❌
const AppLayer = Layer.mergeAll(
  Users.layer,
  Billing.layer,
).pipe(Layer.provide(Database.layer))

// ✅
const ServicesLayer = Layer.mergeAll(
  Users.layer,
  Billing.layer,
)

const AppLayer = ServicesLayer.pipe(Layer.provide(Database.layer))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `merge` | `string[]` | `['Layer.mergeAll']` | Dotted callee names that merge layers |
| `pipe` | `string[]` | `['pipe', 'Function.pipe']` | Dotted callee names of data-first pipes |
| `methods` | `string[]` | `['pipe']` | Method names that pipe the value they are called on |

```ts
'arch/effect-merge-pipe': 'error'
```
