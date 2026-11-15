# 🏷️ naming

File, folder and export names. On by default.

```ts
folders: {
  'apps/web': { naming: { folders: false } },
  'apps/server/src/services/database/migrations': { naming: { files: '^\\d{3}-[a-z0-9-]+\\.ts$', unique: '^(\\d{3})-' } },
  'apps/cli/src/commands': { naming: { exports: '^[a-z][a-zA-Z0-9]*Command$' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `files` | `boolean \| string` | `true` | kebab-case and role file names; a regex adds a file name pattern for the folder |
| `exports` | `boolean \| string` | `true` | Exports start with the file prefix; a regex replaces the folder's export name checks |
| `folders` | `boolean` | `true` | Files start with their folder name |
| `imports` | `Record<string, string \| string[] \| false \| object>` | `{}` | Specifier template → the name a namespace import takes, such as `'@scope/kit-{package}': '{Package}Kit'`. The most specific matching key wins (fewest placeholders, then the longest fixed text; `**/` keys last); `false` drops an inherited one. An object takes the rule's entry options: `{ name, namespace: false, drop }`, and `{ name: false }` skips that import |
| `unique` | `string` | none | Regex for the file name part that must be unique per folder, like a migration number. Detected `migrations/` folders get one, see [detection](../folders.md#-detection) |

Rules: [`arch/files-components-only`](../rules/files-components-only.md), [`arch/naming-exports`](../rules/naming-exports.md), [`arch/naming-file`](../rules/naming-file.md), [`arch/naming-folder`](../rules/naming-folder.md), [`arch/naming-imports`](../rules/naming-imports.md).

Plus `unicorn` (1).
