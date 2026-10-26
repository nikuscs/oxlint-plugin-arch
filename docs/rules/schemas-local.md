# arch/schemas-local

Reports runtime imports from the schema package and any schema construction in the file. Calls that configure the package or format its errors (`z.config(...)`, `z.prettifyError(...)`) build no schema and pass.

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
| `calls` | `string[]` | `['config', 'prettifyError', 'treeifyError', 'flattenError', 'formatError']` | Namespace calls that build no schema; an import used only for them passes |
| `allow` | `string[]` | `[]` | File name suffixes that may build schemas |
| `patterns` | `string[]` | `[]` | Path regexes that may build schemas |
| `message` | `string` | none | Message for both reports |
| `importMessage` | `string` | none | Import message; `{{source}}` is replaced |
| `constructionMessage` | `string` | none | Construction message |

```ts
'arch/schemas-local': ['error', { allow: ['.schemas.ts'] }]
```
