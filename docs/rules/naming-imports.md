# arch/naming-imports

Reports an import whose local name does not match the name its specifier expands to. By default the import must be a namespace import.

```ts
// { source: '@scope/kit-{package}', name: '{Package}Kit' }
// ❌
import { pay } from '@scope/kit-payments'
import * as Payments from '@scope/kit-payments'

// ✅
import * as PaymentsKit from '@scope/kit-payments'
```

Placeholders in `source` capture one path segment each; `{Package}` is the capture in PascalCase, `{package}` in camelCase and `{PACKAGE}` in constant case. The first entry whose `source` matches wins, so write the more specific one first. `import type {} from '…'` and side-effect imports have no name and pass.

| Entry key | Type | Default | |
| --- | --- | --- | --- |
| `source` | `string` | required | Specifier template, like `@scope/kit-{package}/{subpath}`; `**/` stands for any folders (`**/support/{file}.ts`) |
| `name` | `string \| string[] \| false` | required | Allowed local names; `false` skips the import and stops the search |
| `drop` | `string \| string[]` | none | Regexes removed from each captured part before it is cased: `'[.](?:driver\|adapter)$'` turns `storage-s3.driver` into `StorageS3` |
| `namespace` | `boolean` | `true` | Require `import * as`. With `false`, named imports pass and a default or namespace import is checked by name |
| `placeholder` | `string` | `'[^/]+'` | Regex a placeholder matches |
| `message` | `string` | none | Report text for this entry, instead of the rule's `message` |

| Option | Type | Default | |
| --- | --- | --- | --- |
| `imports` | entry list | required | Checked in order |
| `message` | `string` | none | Text added to every report |
| `file` | `string` | none | Path template of the file being linted, like `kit-{module}/**`; its placeholders join the ones in `name`, and a file it does not match is skipped. `{stem}`, `{file}`, `{folder}`, `{parent}` and `{domain}` are always read |
| `stem`, `singularize`, `roles`, `separators` | | | How `{stem}` and `{domain}` are read, as in [`arch/files-exports`](files-exports.md) |

```ts
'arch/naming-imports': ['error', {
  imports: [
    { source: '@scope/kit-contracts/{part}', name: '{Part}Kit' },
    { source: '@scope/kit-{package}/{subpath}', name: '{Package}Kit{Subpath}' },
    { source: '@scope/kit-{package}', name: '{Package}Kit' },
  ],
}]
```
