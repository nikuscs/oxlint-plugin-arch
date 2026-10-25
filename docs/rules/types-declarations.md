# arch/types-declarations

Reports every `type` and `interface` declaration in the file unless `allowPattern` matches it.

```ts
// ❌
interface User {
  id: string
}

// ✅
import type { User } from './user.types'

export function load(user: User) {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allowPattern` | `string \| string[]` | none | Regex for allowed names; a pattern starting with `=` matches the alias value |

```ts
'arch/types-declarations': ['error', { allowPattern: 'Props$' }]
```
