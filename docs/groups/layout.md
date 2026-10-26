# 🗂️ layout

Folder layout and service-file structure. On by default.

```ts
folders: {
  'apps/web': { layout: { services: 'flat', suffixes: ['prompts'] } },
  'apps/server': { layout: { strict: true, operations: 'folders' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `services` | `'flat' \| 'domain' \| false` | `'domain'` | Service folder layout (`services/`, or the folder's [`services`](../folders.md#-folder-keys) key) |
| `hooks` | `'flat' \| 'domain' \| false` | web: 'flat' | `hooks/` layout |
| `components` | `'flat' \| 'domain' \| false` | one group folder | `components/` layout |
| `suffixes` | `string[]` | `[]` | Extra `*.<suffix>.ts` service file kinds |
| `strict` | `boolean` | `false` | Domain service files must be `<domain>[-part].<role>.ts` with a built-in role or a suffix |
| `operations` | `'flat' \| 'folders'` | `'flat'` | Set on the app folder. Where actions and queries live (see below) |
| `service` | `string[]` | `['make{Domain}Service', '{Domain}Service']` | Exports allowed in `<domain>.service.ts` |

| `operations` | Action | Query |
| --- | --- | --- |
| `'flat'` | `order/order-action.create.ts` → `orderActionCreate` | `order/order-query.list.ts` → `orderQueryList` |
| `'folders'` | `order/actions/order-action.create.ts` → `makeOrderActionCreate` | `order/queries/order-query-list.ts` → `makeOrderQueryList` |

Rules: [`arch/backend-service-functions`](../rules/backend-service-functions.md), [`arch/code-object-params`](../rules/code-object-params.md), [`arch/files-domain-constants`](../rules/files-domain-constants.md), [`arch/files-exports`](../rules/files-exports.md), [`arch/files-restricted`](../rules/files-restricted.md), [`arch/naming-file`](../rules/naming-file.md), [`arch/naming-folder`](../rules/naming-folder.md), [`arch/types-inline`](../rules/types-inline.md).
