# arch/schemas-single-use

Reports a non-exported scalar schema constant read once, as an object field or structural element.

```ts
// ❌
const Name = z.string().min(1)

export const User = z.object({ name: Name })

// ✅
export const User = z.object({ name: z.string().min(1) })
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `namespaces` | `string[]` | `['z']` | Schema namespace identifiers |
| `methods` | `string[]` | `['array', 'union', 'record', 'tuple']` | Element calls checked besides `z.object` |
| `structural` | `string[]` | `['and', 'array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'or', 'pipe', 'record', 'transform', 'tuple', 'union']` | Calls that are not scalar |
| `scalars` | `boolean` | `true` | Also check single uses inside `methods` calls |

```ts
'arch/schemas-single-use': ['error', { namespaces: ['z'] }]
```
