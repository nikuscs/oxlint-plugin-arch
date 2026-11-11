# 🖥️ backend

Marks a backend: RPC stays thin, services own data access. Opt-in.

```ts
folders: {
  'apps/server': {
    backend: {
      exports: ['@acme/server/client'],
      registry: { file: 'apps/server/src/core/core.services.ts', skip: ['database'] },
    },
  },
  'apps/server/src/services/**/*-query.*.ts': { deny: { calls: { publish: 'Query files only read; move writes to an action.' } } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `exports` | `string[]` | `<package>/client` | Public entry points other folders may import |
| `registry` | `false \| string \| { file?, skip?, object? }` | detected | Registry file that must list every `services/<domain>/` with a `<domain>.service.ts`. Without `file`, the first of `services/service.ts`, `core/core.services.ts` and `service.ts` in each backend source, skipping `brand`, `database`, `db`, `math`, `security` and `tools`; with `file`, `skip` defaults to none |

Query files (`<services>/**/*-query.*.ts`, and `<services>/*/queries/*.ts` with `layout.operations: 'folders'`) may not call `insertInto`, `updateTable`, `deleteFrom`, `mergeInto`, `replaceInto`, `dispatch` or `send`, through [`deny`](deny.md). A file key on the query files adds a call with `deny: { calls: { publish: '…' } }` and drops one with `send: false`.

Rules: [`arch/backend-registry`](../rules/backend-registry.md), [`arch/boundaries-rpc-database`](../rules/boundaries-rpc-database.md).

Plus `eslint` (1).
