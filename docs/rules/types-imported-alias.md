# arch/types-imported-alias

Reports an exported type alias that only renames an imported type.

```ts
// ❌
import type { User } from './user.types'

export type Account = User

// ✅
import type { User } from './user.types'

export type AccountId = Pick<User, 'id'>
```

```ts
'arch/types-imported-alias': 'error'
```
