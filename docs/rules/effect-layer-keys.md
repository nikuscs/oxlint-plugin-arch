# arch/effect-layer-keys

The keys a layer binds are the methods its service declares in another file: no extra key, none missing.

```ts
// contract/order/order.service.ts
export class Orders extends Context.Service<Orders, {
  readonly create: (params: OrderCreateParams) => Effect.Effect<Order>
  readonly schedule: { readonly cancel: (params: OrderCancelParams) => Effect.Effect<void> }
}>()('@app/contract/order/order.service/Orders') {}

// ❌ server/order/order.layer.ts
Domain.bind({ create: orderActionCreate, remove: orderActionRemove })

// ✅
Domain.bind({ create: orderActionCreate, schedule: { cancel: orderActionScheduleCancel } })
```

The service file is read as text: the member names of the object type after `declaration`, groups nested. A method typed by a reference (`readonly channels: Kit.Channels<…>`) may be bound as an object, and an overloaded method (`readonly get: { <K>(…): …; (…): … }`) is one key. A file that does not exist, or holds no `declaration`, checks nothing.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `service` | `string` | required | Absolute path of the service file; `{folder}`, `{parent}`, `{stem}` and `{file}` come from the layer file's path |
| `callees` | `string[]` | `['*.of', '*.bind']` | Dotted callee names whose object is the binding; `*` is any text |
| `declaration` | `string` | `'Context.Service'` | Text before the `<` that opens the service's type |
| `missing` | `'skip' \| 'error'` | `'skip'` | When the service file or its declaration is missing: check nothing, or report that the layer needs it |
| `message` | `string` | none | Text added to every report; takes the path placeholders (`{folder}`, `{Domain}`), and on an extra key `{Path}` and `{Key}` as in [`arch/effect-service-params`](effect-service-params.md) |
| `file`, `placeholder`, `stem`, `singularize`, `roles`, `separators` | | | How the path placeholders are read, as in [`arch/files-exports`](files-exports.md); a file `file` does not match is skipped |

```ts
'arch/effect-layer-keys': ['error', { service: '/repo/packages/contract/src/{folder}/{folder}.service.ts' }]
```
