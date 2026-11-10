# arch/files-domain-constants

Reports module-level `SCREAMING_CASE` constants (or names matching `pattern`) and points to the `<domain>.constants.ts` file they belong in.

```ts
// ❌ invoice.service.ts
const MAX_LINES = 50

// ✅ invoice.service.ts
import { invoiceMaxLines } from './invoice.constants.ts'
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `data` | `boolean` | `false` | Also report literal data (objects, arrays, `new Map([...])`) of any name |
| `services` | `boolean` | `false` | Skip service objects exposing public methods |
| `pattern` | `string \| string[]` | `'^[A-Z][A-Z0-9_]+$'` | Constant names to report; replaces the default |
| `folders` | `string[]` | `['services']` | A file inside one of these folders takes its domain from its parent folder, like `invoice` in `services/invoice/invoice-list.ts` |
| `roles` | `string[]` | `['action', 'query']` | Otherwise the domain is the file stem with a `-<role>` ending dropped, like `invoice` in `invoice-action.ts` |
| `file` | `string` | `'{domain}.constants.ts'` | The file the message points to; `{domain}` is replaced |

```ts
'arch/files-domain-constants': ['error', { data: true }]
```
