# arch/code-promise-mutation

A push, set or assignment to an outer binding inside a `Promise.all`-style callback.

```ts
// ❌
const users = []
await Promise.all(ids.map(async (id) => users.push(await load(id))))

// ✅
const users = await Promise.all(ids.map((id) => load(id)))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `combinators` | `string[]` | `['Promise.all', 'Promise.allSettled', 'Promise.any', 'Promise.race']` | Dotted calls to inspect |
| `methods` | `string[]` | `['push', 'unshift', 'splice', 'set', 'add']` | Mutating method names |
| `checkAssignments` | `boolean` | `true` | Also report `=`, `+=` and `++` |

```ts
'arch/code-promise-mutation': ['error', { methods: ['push', 'unshift', 'splice', 'set', 'add', 'delete'] }]
```
