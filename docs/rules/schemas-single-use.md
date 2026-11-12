# arch/schemas-single-use

Reports a non-exported scalar schema constant read once, as an object field or structural element. Only `const` declarations count. A chained scalar (`z.string().min(1)`) is scalar; `.or`, `.pipe` and `.transform` chains are structural. Exports, including `export { x }` and `export default x`, are skipped.

```ts
// ❌
const Name = z.string().min(1)

export const User = z.object({ name: Name })

// ✅
export const User = z.object({ name: z.string().min(1) })
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `namespaces` | `string[]` | `['z']` | Schema namespace identifiers; replaces the default |
| `methods` | `string[]` | `['array', 'union', 'record', 'tuple']` | Element calls checked besides `z.object`; replaces the default |
| `structural` | `string[]` | `['and', 'array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'or', 'pipe', 'record', 'transform', 'tuple', 'union']` | Calls whose result is not a scalar schema; replaces the default |
| `scalars` | `boolean` | `true` | Also check single uses as `methods` elements; object fields are always checked while `object` is in `structural` |

```ts
'arch/schemas-single-use': ['error', { namespaces: ['z'] }]
```
