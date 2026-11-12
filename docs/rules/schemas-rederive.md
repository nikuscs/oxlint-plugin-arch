# arch/schemas-rederive

Reports `z.infer` or `z.input` on a schema imported from one of the `from` modules. Sources match exactly, without subpaths. Only `typeof` on an imported identifier is checked; a local schema passes.

```ts
// ❌
import { UserSchema } from '@app/schemas'

type User = z.infer<typeof UserSchema>

// ✅
import type { User } from '@app/schemas'

let user: User
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `from` | `string[]` | required | Modules whose schemas export DTO types |
| `namespaces` | `string[]` | `['z']` | Schema namespace identifiers; replaces the default |
| `operators` | `string[]` | `['infer', 'input']` | Type helpers to report; replaces the default |

```ts
'arch/schemas-rederive': ['error', { from: ['@app/schemas'] }]
'arch/schemas-rederive': ['error', { from: ['@app/schemas'], operators: ['infer', 'input', 'output'] }]
```
