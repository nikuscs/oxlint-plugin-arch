# arch/boundaries-rpc-database

Reports query-builder calls (`selectFrom`, `insertInto`, `updateTable`, `deleteFrom`, `mergeInto`, `executeQuery`) in the files it is enabled for.

```ts
// ❌ rpc/chats.ts
export const listChats = os.handler(({ context }) => context.db.selectFrom('chats').selectAll().execute())

// ✅ rpc/chats.ts
export const listChats = os.handler(({ context }) => context.services.chats.list())
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | `'RPC handlers delegate database work to services.'` | Report text |

```ts
'arch/boundaries-rpc-database': 'error'
```
