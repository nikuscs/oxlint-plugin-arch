# 🖥️ backend

Marks a backend: RPC stays thin, services own data access. Opt-in.

```ts
folders: {
  'apps/server': {
    backend: {
      exports: ['@acme/server/client'],
      registry: { file: 'apps/server/src/core/core.services.ts', skip: ['database'] },
      writes: ['insertInto', 'updateTable', 'deleteFrom', 'dispatch'],
    },
  },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `exports` | `string[]` | `<package>/client` | Public entry points other folders may import |
| `registry` | `false \| string \| { file?, skip?, object? }` | detected | Registry file that must list every `services/<domain>/` with a `<domain>.service.ts`. Without `file`, the first of `services/service.ts`, `core/core.services.ts` and `service.ts` in each backend source, skipping `brand`, `database`, `db`, `math`, `security` and `tools`; with `file`, `skip` defaults to none |
| `writes` | `string[]` | Kysely writes, `dispatch`, `send` | Methods query files may not call; set on the backend folder |

Rules: [`arch/backend-registry`](../rules/backend-registry.md), [`arch/boundaries-rpc-database`](../rules/boundaries-rpc-database.md); `writes` runs through [`deny`](deny.md).

Plus `eslint` (1).
