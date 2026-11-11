# 🗂️ layout

Folder layout and service-file structure. On by default.

```ts
folders: {
  '.': { layout: { files: ['*.prompts.ts', '*.profiler.ts', '*.driver.ts', '*.gateway.ts', '*.queues.ts'] } },
  'apps/web': { layout: { services: 'flat' } },
  'apps/server': { layout: { strict: true, operations: 'folders' } },
  'apps/server/src/domains': { layout: { files: ['*.prompts.ts', '*.gateway.ts', '!*.utils.ts'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `services` | `'flat' \| 'domain' \| false` | `'domain'` | Service folder layout (`services/`, or the folder's [`services`](../folders.md#-folder-keys) key) |
| `hooks` | `'flat' \| 'domain' \| false` | web: 'flat' | `hooks/` layout |
| `components` | `'flat' \| 'domain' \| false` | one group folder | `components/` layout |
| `files` | `string[]` | the built-in names below | File names the service layout allows. Adds to the parent folder's list; `!name` removes one |
| `strict` | `boolean` | `false` | Domain service files must match a name in `files`, each `*` one kebab-case name |
| `operations` | `'flat' \| 'folders'` | `'flat'` | Set on the app folder. Where actions and queries live (see below) |
| `service` | `string[]` | `['make{Domain}Service', '{Domain}Service']` | Exports allowed in `<domain>.service.ts` |

Built-in names: `*.service.ts`, `*.client.ts`, `*.server.ts`, `*.rsc.ts`, `*.rsc.tsx`, `*.utils.ts`, `*.types.ts`, `*.constants.ts`, `*.handler.ts`, `*.test.ts`, `*.spec.ts`, `*-action.*.ts`, `*-query.*.ts`.

A name of the form `*.<word>.ts` that is not built-in, like `*.prompts.ts`, is a file kind across the project: its exports start with the full file name, it is exempt from the service-function and inline-type checks, frontend services may hold it, and other domains may not import it ([`arch/boundaries-imports`](../rules/boundaries-imports.md) `roles`). Other names, like `*-tool.*.ts`, only pass the strict check.

| `operations` | Action | Query |
| --- | --- | --- |
| `'flat'` | `order/order-action.create.ts` → `orderActionCreate` | `order/order-query.list.ts` → `orderQueryList` |
| `'folders'` | `order/actions/order-action.create.ts` → `makeOrderActionCreate` | `order/queries/order-query-list.ts` → `makeOrderQueryList` |

Rules: [`arch/backend-service-functions`](../rules/backend-service-functions.md), [`arch/code-object-params`](../rules/code-object-params.md), [`arch/files-domain-constants`](../rules/files-domain-constants.md), [`arch/files-exports`](../rules/files-exports.md), [`arch/files-restricted`](../rules/files-restricted.md), [`arch/naming-file`](../rules/naming-file.md), [`arch/naming-folder`](../rules/naming-folder.md), [`arch/types-inline`](../rules/types-inline.md).
