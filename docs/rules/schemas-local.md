# arch/schemas-local

Reports runtime imports from the schema package and any schema construction in the file.

```ts
// ❌
import { z } from 'zod'

const User = z.object({ id: z.string() })

// ✅
import { User } from '@app/schemas'

User.parse(input)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `packages` | `string[]` | `['zod']` | Schema packages (subpaths included) |
| `namespaces` | `string[]` | `['z']` | Constructor identifiers |
| `allowIn` | `string[]` | `[]` | File name suffixes that may build schemas |
| `allowPathPatterns` | `string[]` | `[]` | Path regexes that may build schemas |
| `message` | `string` | none | Message for both reports |
| `runtimeImportMessage` | `string` | none | Import message; `{{source}}` is replaced |
| `constructionMessage` | `string` | none | Construction message |

```ts
'arch/schemas-local': ['error', { allowIn: ['.schemas.ts'] }]
```
