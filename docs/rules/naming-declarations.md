# arch/naming-declarations

Reports declarations, exported or not, that miss the file prefix, or that miss `pattern` when it is set.

```ts
// ❌ invoice.utils.ts
export function formatTotal() {}

// ✅ invoice.utils.ts
export function invoiceFormatTotal() {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `kinds` | `('function' \| 'const' \| 'let' \| 'var' \| 'class' \| 'type' \| 'interface' \| 'enum')[]` | all | Declaration kinds to check |
| `pattern` | `string \| string[]` | none | Regex to match instead of the file prefix |
| `flags` | `string` | none | Flags for `pattern` |
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | How the prefix is read from the file name |
| `roles` | `string[]` | `[]` | Role suffixes stripped from the prefix |
| `separators` | `string[]` | `['.', '-']` | Separators before a trailing role |
| `normalize` | `'remove-separators' \| 'none'` | `'remove-separators'` | Compare case-insensitively without `-`, `_`, `.` |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Also accept the prefix without a trailing `s` |
| `allow` | `string \| string[]` | none | Names to skip |

```ts
'arch/naming-declarations': ['error', { kinds: ['function', 'class'], singularize: 'trailing-s' }]
```
