# arch/backend-table-owner

Reports a query that reads or writes a table another domain owns.

```ts
// ❌ domains/order/order.queries.ts
db.selectFrom('users').selectAll()
db.updateTable('userProfiles').set(row)

// ✅
db.selectFrom('orders').innerJoin('users', 'users.id', 'orders.userId').selectAll()
db.selectFrom('orders').select((eb) => [eb.selectFrom('users').select('name').whereRef('users.id', '=', 'orders.userId').as('name')])
```

The table is the plain string first argument of a `methods` call, with an `as alias` dropped. Joins are never checked, and a `methods` call inside the arguments of another query-builder call (a subquery in `select`, `where` or a join) is skipped, so every top-level read and every write is checked. A dynamic table name is skipped.

The file's domain is the `{domain}` path capture. A table's owner is its `owners` entry; otherwise, with `prefix`, the longest known domain whose camelCase name starts the table at a word boundary: `order` owns `orders` and `orderSchedules`, `supplier-order` owns `supplierOrders`. Known domains are `domains`, the file's own domain and the sibling folders of the folder named after it. A table with no owner is skipped.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `methods` | `string[]` | `['selectFrom', 'insertInto', 'updateTable', 'deleteFrom', 'replaceInto', 'mergeInto']` | Calls whose first argument is a table; replaces the default list |
| `owners` | `Record<string, string>` | none | Table name to owning domain; wins over the prefix |
| `domains` | `string[]` | none | Domains known besides the sibling folders |
| `prefix` | `boolean` | `true` | Read owners from table name prefixes; `false` reads only `owners` |
| `message` | `string` | none | Text added to every report |
| `file`, `placeholder` | `string` | none | Path template of the file being linted, like `domains/{domain}/**`; a file it does not match is skipped. Without it the domain is the file stem |
| `stem`, `singularize`, `roles`, `separators` | | | How `{domain}` is read, as in [`arch/files-exports`](files-exports.md) |

```ts
'arch/backend-table-owner': ['error', { file: 'domains/{domain}/**' }]
'arch/backend-table-owner': ['error', { file: 'domains/{domain}/**', prefix: false, owners: { users: 'user', sessions: 'auth' } }]
```
