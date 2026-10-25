# arch/naming-exports

Reports export names that miss the file prefix (`mode: 'prefix'`), miss `pattern` (`'pattern'`), or are not the function name a `file` template expands to (`'template'`). Pass several option objects to run several checks.

```ts
// ❌ invoice.utils.ts
export function formatTotal() {}

// ✅ invoice.utils.ts
export function invoiceFormatTotal() {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `mode` | `'prefix' \| 'pattern' \| 'template'` | `'prefix'` | Which check runs |
| `scope` | `'exports' \| 'functions' \| 'declarations'` | `'exports'` | Exports; exports plus every function; or every named declaration |
| `types` | `boolean` | `false` | Prefix and pattern: skip type-only exports |
| `services` | `boolean` | `false` | Prefix and pattern: also check public methods of exported service objects |
| `allow` | `string \| string[]` | none | Names to skip |
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | Prefix: how it is read from the file name |
| `roles` | `string[]` | `[]` | Prefix: role suffixes stripped |
| `separators` | `string[]` | `['.', '-']` | Prefix: separators before a trailing role |
| `normalize` | `'remove-separators' \| 'none'` | `'remove-separators'` | Prefix: compare case-insensitively without `-`, `_`, `.` |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Prefix: also accept it without a trailing `s` |
| `pattern` | `string \| string[]` | required | Pattern: regex the name must match |
| `flags` | `string` | none | Pattern: regex flags |
| `file` | `string` | required | Template: file name template, like `{name}.action.ts` |
| `export` | `string` | required | Template: name template; `{Name}` is PascalCase, `{name}` is raw |
| `match` | `'all' \| 'some'` | `'all'` | Template: every function must match, or at least one |
| `placeholder` | `string` | `'[a-z0-9-]+'` | Template: regex a placeholder matches in the file name |
| `camelCase` | `boolean` | `false` | Template: camelCase lowercase placeholders |

```ts
'arch/naming-exports': ['error', { mode: 'prefix' }, { mode: 'pattern', pattern: '^use[A-Z]', types: true }]
```
