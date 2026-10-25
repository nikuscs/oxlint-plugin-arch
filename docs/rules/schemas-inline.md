# arch/schemas-inline

Reports structural schemas written inline as elements of `z.array()`, `z.union()`, `z.record()` or `z.tuple()`.

```ts
// ❌
export const Users = z.array(z.object({ id: z.string() }))

// ✅
export const User = z.object({ id: z.string() })
export const Users = z.array(User)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `namespaces` | `string[]` | `['z']` | Schema namespace identifiers |
| `methods` | `string[]` | `['array', 'union', 'record', 'tuple']` | Calls whose elements are checked |
| `structural` | `string[]` | `['array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'record', 'tuple', 'union']` | Calls that count as structural |
| `scalars` | `boolean` | `true` | Allow inline scalars like `z.string()` |

```ts
'arch/schemas-inline': ['error', { namespaces: ['z', 'v'] }]
```
