# arch/types-imported-alias

Reports an exported type alias that only renames an imported type. Also reported: `type Account = User` followed by `export type { Account }` or `export { Account }`; a renamed or default import counts. Generics, unions, intersections and unexported aliases pass.

```ts
// ❌
import type { User } from './user.types'

export type Account = User

// ✅
import type { User } from './user.types'

export type AccountId = Pick<User, 'id'>
```

No options.

```ts
'arch/types-imported-alias': 'error'
```
