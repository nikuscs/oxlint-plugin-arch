# arch/types-namespace-import

Reports a type-only import with more than `max` named specifiers and suggests an `import type * as` name. It has no autofix.

```ts
// ❌
import type { User, Role, Team, Invite } from './user.types'

let member: User | Role | Team | Invite

// ✅
import type * as UserTypes from './user.types'

let member: UserTypes.User | UserTypes.Role | UserTypes.Team | UserTypes.Invite
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `3` | Most named type imports allowed |
| `names` | `Record<string, string>` | `{}` | Namespace name per import source |

```ts
'arch/types-namespace-import': ['error', { max: 3, names: { '@app/user': 'UserTypes' } }]
```
