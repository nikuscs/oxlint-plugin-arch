# arch/naming-folder

Reports files whose name does not start with their domain folder name. The folder name alone also passes (`dialogs/dialog.tsx`). Only `.ts`, `.tsx`, `.js` and `.jsx` are stripped, so `invoice.test.ts` needs `.` in `separators`.

```ts
// ❌
// invoices/create.ts

// ✅
// invoices/invoice-create.ts

// ❌ after: 'components'
// src/components/admin/insights/insights-chart.tsx

// ✅
// src/components/admin/insights/admin-insights-chart.tsx
```

A file outside `after` is skipped. A file directly in the `after` folder uses that folder.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `singularize` | `'none' \| 'trailing-s'` | `'trailing-s'` | Also accept the folder name without a trailing `s` |
| `separators` | `string[]` | `['-']` | Separators allowed after the prefix. `.` is not allowed by default, add it to accept `invoice.create.ts`. The first entry joins nested folders for `after` |
| `after` | `string` | none | Use every folder after this path as the domain, joined |
| `prefixes` | `string[]` | `[]` | File name prefixes to ignore, like `use-` (one is stripped) |

```ts
'arch/naming-folder': ['error', { after: 'src/features', prefixes: ['use-'] }]
'arch/naming-folder': ['error', { separators: ['-', '.'] }]
```
