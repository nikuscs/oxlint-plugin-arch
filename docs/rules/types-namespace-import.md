# arch/types-namespace-import

Reports a type-only import with more than `max` named specifiers and suggests an `import type * as` name. It has no autofix.

Applies to `import type { … }` and to an import whose every specifier is `type`; a mixed import, a default import and a namespace import keep their list. The name is the last path segment in PascalCase plus `Types` (`./harness.ts` → `HarnessTypes`, `./user.types` → `UserTypes`; a leading digit gets `Module`); `names` overrides it per source and must be identifier-shaped.

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
| `max` | `number` | `3` | Most named type imports allowed; `0` reports any named type import |
| `names` | `Record<string, string>` | `{}` | Namespace name per import source |

```ts
'arch/types-namespace-import': ['error', { max: 3, names: { '@app/user': 'UserTypes' } }]
```
