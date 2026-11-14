# arch/files-exports

Reports exports outside `names` and `patterns`, where placeholders such as `{Domain}` and `{folder}` expand from the file path. With `factory`, also reports functions not named after it, and files with no function.

```ts
// names: ['use{Domain}Query']
// ❌ invoice.query.ts
export function useInvoiceQuery() {}
export function formatInvoice() {}

// ✅ invoice.query.ts
export function useInvoiceQuery() {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `names` | `string[]` | none | Allowed names, with [placeholders](#placeholders) |
| `patterns` | `string[]` | `[]` | Allowed regex sources matched against the whole name, same placeholders |
| `file` | `string` | none | Path template that adds placeholders, like `{area}/actions/{verb}.ts`; a file it does not match is skipped |
| `placeholder` | `string` | `'[a-z0-9-]+'` | Regex a `file` placeholder matches |
| `stem` | `'before-first-dot' \| 'full-basename' \| 'folder'` | `'before-first-dot'` | How the domain is read: from the file name, or with `'folder'` the name of the folder the file is in (`supplier-order/` gives `SupplierOrder`) |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Drop a trailing `s` from the domain's last word (`automatic-orders` gives `AutomaticOrder`) |
| `roles` | `string[]` | `[]` | Role names stripped from the end of a domain read from the file name |
| `separators` | `string[]` | `['.', '-']` | Separators before a trailing role |
| `types` | `boolean` | `false` | Skip type-only exports |
| `factory` | `string` | none | Required function name; `{Stem}` is the PascalCase file name, `{stem}` is raw. Every checked function must be named exactly this; `stem` and `roles` do not apply to it |
| `scope` | `'exports' \| 'declarations'` | `'exports'` | Functions `factory` checks: exported, or every function |

## Placeholders

| Placeholder | Reads |
| --- | --- |
| `{domain}` | The file name up to its first dot, or with `stem: 'folder'` the folder name; `singularize` and `roles` apply |
| `{stem}` | The file name up to its first dot, after `roles` |
| `{file}` | The whole file name without its extension |
| `{folder}`, `{parent}` | The folder the file is in, and the one above |
| your own | Each `{name}` in `file` |

`{Domain}` is PascalCase, `{domain}` camelCase and `{DOMAIN}` constant case (`SUPPLIER_ORDER`), for every placeholder.

At least one of `names`, `patterns` or `factory` is required. `factory` and `names` or `patterns` are checked separately.

Named exports are checked by their exported aliases, including `factory` with `scope: 'exports'`. Default exports keep their local names. Destructuring exports are checked once per bound name; aliased name diagnostics point to the export specifier.

```ts
'arch/files-exports': ['error', { names: ['use{Domain}Query'], types: true }]
'arch/files-exports': ['error', { stem: 'folder', singularize: 'trailing-s', patterns: ['{domain}Action[A-Z]\\w*'] }]
'arch/files-exports': ['error', { file: '{area}/actions/{verb}.ts', names: ['{area}Action{Verb}', '{Area}Action{Verb}Input'] }]
```
