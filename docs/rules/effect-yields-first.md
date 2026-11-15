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

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allow` | `string \| string[]` | none | Regexes for dotted callees of calls that may come before the dependencies, such as `'^Effect[.]annotateCurrentSpan$'` |
| `services` | `string \| string[]` | none | Regexes for what counts as a dependency, matched against the dotted member (`'^Users[.]'`); without it, any member that starts with a capital |
| `message` | `string` | none | Text added to every report |

```ts
'arch/effect-yields-first': 'error'
'arch/effect-yields-first': ['error', { allow: '^Effect[.]annotateCurrentSpan$', message: 'Yield services first.' }]
```
