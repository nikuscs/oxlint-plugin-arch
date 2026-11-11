# arch/files-exports

Reports exports outside `names` and `patterns`, where `{Domain}` and `{domain}` expand from the file name. With `factory`, also reports functions not named after it, and files with no function.

```ts
// ❌ invoice.query.ts
export function useInvoiceQuery() {}
export function formatInvoice() {}

// ✅ invoice.query.ts
export function useInvoiceQuery() {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `names` | `string[]` | none | Allowed names, with `{Domain}` / `{domain}` |
| `patterns` | `string[]` | `[]` | Allowed regex sources, same placeholders |
| `stem` | `'before-first-dot' \| 'full-basename' \| 'folder'` | `'before-first-dot'` | How the domain is read: from the file name, or with `'folder'` the name of the folder the file is in (`supplier-order/` gives `SupplierOrder`) |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Drop a trailing `s` from the domain's last word (`automatic-orders` gives `AutomaticOrder`) |
| `roles` | `string[]` | `[]` | Role names stripped from the end of a domain read from the file name |
| `separators` | `string[]` | `['.', '-']` | Separators before a trailing role |
| `types` | `boolean` | `false` | Skip type-only exports |
| `factory` | `string` | none | Required function name; `{Stem}` is the PascalCase file name, `{stem}` is raw |
| `scope` | `'exports' \| 'declarations'` | `'exports'` | Functions `factory` checks: exported, or every function |

At least one of `names`, `patterns` or `factory` is required.

Named exports are checked by their exported aliases, including `factory` with `scope: 'exports'`. Default exports keep their local names. Destructuring exports are checked once per bound name; aliased name diagnostics point to the export specifier.

```ts
'arch/files-exports': ['error', { names: ['use{Domain}Query'], types: true }]
'arch/files-exports': ['error', { stem: 'folder', singularize: 'trailing-s', patterns: ['{domain}Action[A-Z]\\w*'] }]
```
