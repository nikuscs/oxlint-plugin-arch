# arch/types-duplicate

Reports an interface, object type alias or struct Schema with the same members as one declared earlier in the file.

Members are compared as text without `readonly`, whitespace or separators, in any order. Only object-literal aliases are compared, so `type B = A` and unions are not; an interface without `extends` and an object alias compare equal. Interfaces compare only with the same `extends`; struct Schemas compare only with each other. The report names both: `B has the same members as A; use A, or derive one from the other.`

```ts
// ❌
interface User { id: string; name: string }
interface Author { name: string; id: string }

// ✅
interface User { id: string; name: string }
type Author = User
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `structs` | `string[]` | `['Schema.Struct']` | Dotted callee names whose first argument object lists struct fields; replaces the default |
| `min` | `number` | `2` | Fewest members a type needs to be compared |

```ts
'arch/types-duplicate': ['error', { structs: ['Schema.Struct', 'z.object'] }]
```
