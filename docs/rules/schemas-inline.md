# arch/schemas-inline

Reports structural schemas written inline as elements of `z.array()`, `z.union()`, `z.record()` or `z.tuple()`.

```ts
// ❌
export const Users = z.array(z.object({ id: z.string() }))

// ✅
export const User = z.object({ id: z.string() })
export const Users = z.array(User)
export const UsersById = z.record(z.string(), User)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `namespaces` | `string[]` | `['z']` | Schema namespace identifiers; replaces the default |
| `methods` | `string[]` | `['array', 'union', 'record', 'tuple']` | Calls whose elements are checked; replaces the default |
| `structural` | `string[]` | `['array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'record', 'tuple', 'union']` | Calls that count as structural; replaces the default |
| `scalars` | `boolean` | `true` | Allow a bare scalar call like `z.string()`; chains, members and structural calls still need a named schema |

```ts
'arch/schemas-inline': ['error', { namespaces: ['z', 'v'] }]
```
