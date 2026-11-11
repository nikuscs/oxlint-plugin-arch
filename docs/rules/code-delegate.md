# arch/code-delegate

Reports a handler that does more than read its services, make one call and return: any other statement, a call past `max`, a ternary or a nested function.

```ts
// ❌
export const cancel = rpc.app.orders.cancel.effect(function* ({ input }) {
  const db = yield* Database.Database
  const order = yield* db.selectFrom('orders').where('id', '=', input.id).executeTakeFirst()
  if (!order) {
    return yield* Effect.fail(new OrderMissing())
  }
  return yield* orderActionCancel({ order })
})

// ✅
export const cancel = rpc.app.orders.cancel.effect(function* ({ input }) {
  const actor = yield* Actor.Actor
  return yield* orderActionCancel({ actor, input })
})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `methods` | `string[]` | `['handler', 'effect']` | A function passed to a call whose last member name is listed is a handler |
| `reads` | `string[]` | `['Effect.serviceOption']` | Dotted callees whose yielded or awaited call reads a service, not counted as the handler's call |
| `max` | `integer` | `1` | Delegated calls a handler may make |

A statement may be a read (a variable from `yield*`, `yield` or `await` of a value that is not a call, or of a call in `reads`), a delegated call (a yielded or awaited call), or a `return`. Plain calls inside them are allowed.

```ts
'arch/code-delegate': 'error'
```
