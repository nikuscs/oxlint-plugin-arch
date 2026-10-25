# 🗂️ layout

Folder layout and service-file structure. On by default.

```ts
folders: {
  'apps/web': { layout: { services: 'flat', suffixes: ['prompts'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `services` | `'flat' \| 'domain' \| false` | `'domain'` | `services/` layout |
| `hooks` | `'flat' \| 'domain' \| false` | web: 'flat' | `hooks/` layout |
| `components` | `'flat' \| 'domain' \| false` | one group folder | `components/` layout |
| `suffixes` | `string[]` | `[]` | Extra `*.<suffix>.ts` service file kinds |

Rules: [`arch/backend-service-functions`](../rules/backend-service-functions.md), [`arch/code-object-params`](../rules/code-object-params.md), [`arch/files-domain-constants`](../rules/files-domain-constants.md), [`arch/files-exports`](../rules/files-exports.md), [`arch/files-restricted`](../rules/files-restricted.md), [`arch/naming-folder`](../rules/naming-folder.md), [`arch/types-inline`](../rules/types-inline.md).
