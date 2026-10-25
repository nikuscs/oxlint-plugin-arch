# 🏷️ naming

File, folder and export names. On by default.

```ts
folders: {
  'apps/web': { naming: { folders: false } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `files` | `boolean` | `true` | kebab-case and role file names |
| `exports` | `boolean` | `true` | Exports start with the file prefix |
| `folders` | `boolean` | `true` | Files start with their folder name |

Rules: [`arch/files-components-only`](../rules/files-components-only.md), [`arch/naming-exports`](../rules/naming-exports.md), [`arch/naming-file`](../rules/naming-file.md), [`arch/naming-folder`](../rules/naming-folder.md).

Plus `unicorn` (1).
