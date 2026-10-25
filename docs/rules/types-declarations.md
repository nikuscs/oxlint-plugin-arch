# arch/types-declarations

Reports every `type` and `interface` declaration in the file unless `allow` matches it.

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
| `allow` | `string \| string[]` | none | Regex for allowed names; a pattern starting with `=` or `^=` matches the alias's `= value` text |

```ts
'arch/types-declarations': ['error', { allow: 'Props$' }]
```
