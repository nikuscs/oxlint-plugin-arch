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
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | How the domain is read from the file name |
| `roles` | `string[]` | `[]` | Role suffixes stripped from the domain |
| `separators` | `string[]` | `['.', '-']` | Separators before a trailing role |
| `types` | `boolean` | `false` | Skip type-only exports |
| `factory` | `string` | none | Required function name; `{Stem}` is the PascalCase file name, `{stem}` is raw |
| `scope` | `'exports' \| 'declarations'` | `'exports'` | Functions `factory` checks: exported, or every function |

At least one of `names`, `patterns` or `factory` is required.

```ts
'arch/files-exports': ['error', { names: ['use{Domain}Query'], types: true }]
```
