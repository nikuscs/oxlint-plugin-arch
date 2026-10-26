# arch/naming-folder

Reports files whose name does not start with their domain folder name.

```ts
// ❌
// invoices/create.ts

// ✅
// invoices/invoice-create.ts
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `singularize` | `'none' \| 'trailing-s'` | `'trailing-s'` | Also accept the folder name without a trailing `s` |
| `separators` | `string[]` | `['-']` | Separators allowed after the prefix |
| `after` | `string` | none | Use every folder after this path as the domain, joined |
| `prefixes` | `string[]` | `[]` | File name prefixes to ignore, like `use-` |

```ts
'arch/naming-folder': ['error', { after: 'src/features', prefixes: ['use-'] }]
```
