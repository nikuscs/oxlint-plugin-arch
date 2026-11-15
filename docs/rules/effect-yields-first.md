# arch/effect-yields-first

In a generator, every `const x = yield* Namespace.Service` comes before any other statement.

```ts
// ❌
Effect.fn('order.create')(function* ({ input }) {
  const db = yield* Database.Database
  const product = yield* db.first({ query })
  const wallets = yield* Wallets.Wallets
})

// ✅
Effect.fn('order.create')(function* ({ input }) {
  const db = yield* Database.Database
  const wallets = yield* Wallets.Wallets
  const product = yield* db.first({ query })
})
```

A dependency is a yielded member that starts with a capital, destructured or not. A yielded call or a lowercase member (`yield* DateTime.now`) is work, not a dependency. A nested generator has its own list.

```ts
'arch/effect-yields-first': 'error'
```
