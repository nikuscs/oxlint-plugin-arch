# arch/naming-declarations

Reports declarations, exported or not, that miss the file prefix, or that miss `pattern` when it is set. Pass several option objects to check each kind its own way. Loop header bindings such as `for (const line of lines)` are skipped; declarations in the loop body are checked. Declarations at any depth are checked, local ones too. Destructured bindings are skipped.

```ts
// ❌ invoice.utils.ts
export function formatTotal() {}

// ✅ invoice.utils.ts
export function invoiceFormatTotal() {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `kinds` | `('function' \| 'const' \| 'let' \| 'var' \| 'class' \| 'type' \| 'interface' \| 'enum')[]` | all | Declaration kinds to check. An empty list checks every kind |
| `pattern` | `string \| string[]` | none | Regex to match instead of the file prefix; takes `{folder}`, `{parent}`, `{stem}` and `{file}` from the path (`{Stem}` PascalCase, `{STEM}` constant case) |
| `flags` | `string` | none | Flags for `pattern` |
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | How the prefix is read from the file name |
| `roles` | `string[]` | `[]` | Role suffixes stripped from the prefix |
| `separators` | `string[]` | `['.', '-']` | Separators before a trailing role |
| `normalize` | `'remove-separators' \| 'none'` | `'remove-separators'` | Compare case-insensitively without `-`, `_`, `.` |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Also accept the prefix without a trailing `s` |
| `prefix` | `('file' \| 'folder' \| 'parent')[]` | `['file']` | Where the prefix may come from: the file name, its folder, the folder above |
| `allow` | `string \| string[]` | none | Regexes for names to skip, such as `'ErrorKind$'` |
| `file`, `placeholder` | `string` | none | Path template that adds placeholders to `pattern`, like `kit-{module}/src/**`; a file it does not match is skipped |
| `message` | `string` | none | Text added to every report |

```ts
'arch/naming-declarations': ['error', { kinds: ['function', 'class'], singularize: 'trailing-s' }]
'arch/naming-declarations': ['error', { stem: 'full-basename', roles: ['utils'] }]
'arch/naming-declarations': [
  'error',
  { kinds: ['function'], prefix: ['file', 'folder'] },
  { kinds: ['type', 'interface'], pattern: '^{Folder}' },
  { kinds: ['const'], pattern: ['^{folder}[A-Z]', '^{FOLDER}_'] },
]
```

With the second line, `ledger-utils.ts` expects the prefix `ledger`.
