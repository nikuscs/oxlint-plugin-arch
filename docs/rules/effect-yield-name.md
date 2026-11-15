# arch/effect-yield-name

A `const` that holds a yielded service is named after the service in camelCase.

```ts
// ❌
const service = yield* Orders.Orders
const order = yield* Orders.Orders

// ✅
const orders = yield* Orders.Orders
```

Only `const name = yield* Namespace.Service` is checked, where `Service` starts with a capital. A destructured yield, a call (`yield* Orders.Orders.get()`) and a lowercase member (`yield* DateTime.now`) are skipped.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `names` | `Record<string, string \| string[]>` | `{}` | The name a service takes instead, keyed by `Namespace.Service` or `*.Service` |
| `allow` | `string \| string[]` | none | Regexes for names that always pass, such as `'^kit'` |

```ts
'arch/effect-yield-name': ['error', { names: { 'Database.Database': 'db' }, allow: '^kit' }]
```
