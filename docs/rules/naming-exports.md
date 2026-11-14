# arch/naming-exports

Reports export names that miss the file prefix (`mode: 'prefix'`), miss `pattern` (`'pattern'`), or are not the function name a `file` template expands to (`'template'`). An aliased export is checked by its exported name, and a default export by its local name. Pass several option objects to run several checks.

```ts
// ❌ invoice.utils.ts
export function formatTotal() {}

// ✅ invoice.utils.ts
export function invoiceFormatTotal() {}

// ❌ invoice-action.send.ts, mode: 'template'
export function makeWrongFactory() {}

// ✅ invoice-action.send.ts
export function makeInvoiceActionSend() {}
```

In template mode, placeholders such as `{domain}` and `{name}` come from `file`, and a file that does not match `file` is skipped. `file` may hold folders (`{domain}/actions/{name}.ts`), and `export` may list several allowed names. Only functions are checked, private ones too when `scope` is not `'exports'`.

In prefix mode, `prefix` lists where the prefix may come from: the file name, its folder, or the folder above. A name passes when it starts with any of them, so a file in `invoice/` need not repeat `invoice` in its own name.

```ts
// prefix: ['file', 'folder']
// ✅ invoice/send.ts
export const invoiceSend = () => {}
export const sendNow = () => {}
```

In pattern mode, `pattern` takes `{folder}`, `{parent}`, `{stem}` and `{file}` from the path: `{Folder}` is PascalCase, `{folder}` camelCase, `{FOLDER}` constant case.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `mode` | `'prefix' \| 'pattern' \| 'template'` | `'prefix'` | Which check runs |
| `scope` | `'exports' \| 'functions' \| 'declarations'` | `'exports'` | Exports; exports plus every function; or every named declaration |
| `types` | `boolean` | `false` | Prefix and pattern: skip type-only exports. No effect with `scope: 'declarations'` |
| `services` | `boolean` | `false` | Prefix and pattern: also check public methods of exported service objects |
| `allow` | `string \| string[]` | none | Regexes for names to skip |
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | Prefix: how it is read from the file name |
| `roles` | `string[]` | `[]` | Prefix: role suffixes stripped |
| `separators` | `string[]` | `['.', '-']` | Prefix: separators before a trailing role |
| `normalize` | `'remove-separators' \| 'none'` | `'remove-separators'` | Prefix: compare case-insensitively without `-`, `_`, `.` |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Prefix: also accept it without a trailing `s` |
| `prefix` | `('file' \| 'folder' \| 'parent')[]` | `['file']` | Prefix: where the prefix may come from |
| `pattern` | `string \| string[]` | required | Pattern: regex the name must match, with path placeholders |
| `flags` | `string` | none | Pattern: regex flags |
| `file` | `string` | required | Template: file name template, like `{name}.action.ts`; with `/` it reads folders too |
| `export` | `string \| string[]` | required | Template: allowed name templates; `{Name}` is PascalCase, `{name}` is raw |
| `match` | `'all' \| 'some'` | `'all'` | Template: every function must match, or at least one; `some` also reports a file with no function |
| `placeholder` | `string` | `'[a-z0-9-]+'` | Template: regex a placeholder matches in the file name |
| `camelCase` | `boolean` | `false` | Template: camelCase lowercase placeholders |

```ts
'arch/naming-exports': ['error', { mode: 'prefix' }, { mode: 'pattern', pattern: '^use[A-Z]', types: true }]
'arch/naming-exports': ['error', { mode: 'template', file: '{domain}-action.{name}.ts', export: 'make{Domain}Action{Name}' }]
'arch/naming-exports': ['error', { mode: 'pattern', scope: 'functions', pattern: '^{folder}(?:Action|Query)[A-Z]' }]
'arch/naming-exports': ['error', { prefix: ['file', 'folder'], singularize: 'trailing-s' }]
```
