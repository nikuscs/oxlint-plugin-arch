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
| `allow` | `string \| string[]` | none | Regexes for allowed names; a pattern starting with `=` or `^=` tests `= <alias value>` and never matches an interface. An empty string allows nothing |
| `modules` | `boolean` | `false` | Allow declarations inside `declare module '…' {}` and `declare global {}`; ones outside the block still report |

```ts
'arch/types-declarations': ['error', { allow: 'Props$' }]
'arch/types-declarations': ['error', { modules: true }]
'arch/types-declarations': ['error', { allow: ['Service$', '^= ReturnType<typeof '] }]
```
