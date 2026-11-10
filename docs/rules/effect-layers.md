# arch/effect-layers

From `min` layers, each layer of a merge, and each layer in an array passed to a provide call, sits on its own line.

Provide arrays are checked in any argument position, so the pipe form and the data-first form both count. The fix changes only whitespace and keeps commas as written. Layers separated by comments or wrapped in parentheses, and arrays with holes, are reported without a fix.

```ts
// ❌
const ServicesLayer = Layer.mergeAll(Users.layer, Billing.layer)
const AppLayer = ServicesLayer.pipe(Layer.provide([Database.layer, Cache.layer]))

// ✅
const ServicesLayer = Layer.mergeAll(
  Users.layer,
  Billing.layer,
)
const AppLayer = ServicesLayer.pipe(Layer.provide([
  Database.layer,
  Cache.layer,
]))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `merge` | `{ callees?, min? }` | | Merges whose arguments are layers. `callees` lists dotted callee names (default `['Layer.mergeAll']`); `min` is the smallest merge that must break (default `2`) |
| `provide` | `{ callees?, min? }` | | Provide calls whose array arguments are layers. `callees` lists dotted callee names (default `['Effect.provide', 'Layer.provide', 'Layer.provideMerge']`); `min` is the smallest array that must break (default `2`) |
| `indent` | `number \| 'tab'` | `2` | Spaces per indent level for the fix, or `'tab'` |

```ts
'arch/effect-layers': ['error', { merge: { min: 3 }, provide: { callees: ['Effect.provide', 'Layer.provide'] } }]
```
