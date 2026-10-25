# arch/files-domain-constants

Reports module-level `SCREAMING_CASE` constants and points to the `<domain>.constants.ts` file they belong in.

```ts
// ❌ invoice.service.ts
const MAX_LINES = 50

// ✅ invoice.service.ts
import { invoiceMaxLines } from './invoice.constants.ts'
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `includeData` | `boolean` | `false` | Also report literal data (objects, arrays, `new Map([...])`) of any name |
| `allowServiceMethods` | `boolean` | `false` | Skip service objects exposing public methods |

```ts
'arch/files-domain-constants': ['error', { includeData: true }]
```
