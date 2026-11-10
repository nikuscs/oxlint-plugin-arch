# arch/boundaries-rpc-database

Reports query-builder method calls (`methods`, by default `selectFrom`, `insertInto`, `updateTable`, `deleteFrom`, `mergeInto`, `executeQuery`), by name or literal computed key like `db['selectFrom']()`, in the files it is enabled for.

```ts
// ❌ rpc/chats.ts
export const listChats = os.handler(({ context }) => context.db.selectFrom('chats').selectAll().execute())

// ✅ rpc/chats.ts
export const listChats = os.handler(({ context }) => context.services.chats.list())
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | `'RPC handlers delegate database work to services.'` | Report text |
| `methods` | `string[]` | the six names above | Query-builder method names to report; replaces the default list |

```ts
'arch/boundaries-rpc-database': 'error'
'arch/boundaries-rpc-database': ['error', { methods: ['select', 'insert', 'update', 'delete', 'execute'] }]
```
