# arch/code-promise-mutation

Reports mutations to outer bindings anywhere in a `Promise.all`-style call's arguments, including synchronous argument evaluation.

```ts
// ❌
const users = []
await Promise.all(ids.map(async (id) => users.push(await load(id))))
await Promise.all([Promise.resolve(users.push(user))])

// ✅
const users = await Promise.all(ids.map((id) => load(id)))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `combinators` | `string[]` | `['Promise.all', 'Promise.allSettled', 'Promise.any', 'Promise.race']` | Dotted calls to inspect |
| `methods` | `string[]` | `['push', 'unshift', 'splice', 'set', 'add']` | Mutating method names |
| `assignments` | `boolean` | `true` | Also report `=`, `+=` and `++` |

```ts
'arch/code-promise-mutation': ['error', { methods: ['push', 'unshift', 'splice', 'set', 'add', 'delete'] }]
```
