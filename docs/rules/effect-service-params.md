# arch/effect-service-params

A method of a service class takes a named params type, not a wire Schema or an inline shape.

```ts
// ❌ order/order.service.ts
export class Orders extends Context.Service<Orders, {
  readonly get: (params: OrderSchemas.OrderGetInput) => Effect.Effect<Order>
  readonly find: (params: { id: string }) => Effect.Effect<Order>
}>()('@app/contract/order/order.service/Orders') {}

// ✅
export class Orders extends Context.Service<Orders, {
  readonly get: (params: OrderGetParams) => Effect.Effect<Order>
  readonly schedule: { readonly cancel: (params: OrderScheduleCancelParams) => Effect.Effect<void> }
}>()('@app/contract/order/order.service/Orders') {}
```

The first parameter of every function member is checked, through nested groups. Only the last part of a qualified type is matched (`Orders.OrderGetParams` is `OrderGetParams`). A method without parameters and a member that is not a function are skipped. Two methods may share one params type.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `name` | `string \| string[]` | `'^{Folder}\\w*Params$'` | Regexes for the type name. Placeholders come from the path (`{Folder}`, `{Stem}`) and the method: `{Path}` (`ScheduleCancel`) and `{Key}` (`Cancel`) |
| `allow` | `string \| string[]` | none | Regexes for whole written types that pass, such as `'^WalletKit\\.'` |
| `declaration` | `string` | `'Context.Service'` | The call whose second type argument holds the methods |
| `message` | `string` | none | Text added to every report; takes the same placeholders as `name`, `{Path}` and `{Key}` included |
| `file`, `placeholder`, `stem`, `singularize`, `roles`, `separators` | | | How the path placeholders are read, as in [`arch/files-exports`](files-exports.md); a file `file` does not match is skipped |

```ts
'arch/effect-service-params': ['error', { name: '^{Folder}{Path}Params$' }]
'arch/effect-service-params': ['error', { name: ['^{Folder}\\w*Params$', '^SearchParams$'], allow: 'Kit\\.' }]
```
