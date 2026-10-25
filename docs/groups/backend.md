# 🖥️ backend

Marks a backend: RPC stays thin, services own data access. Opt-in.

```ts
folders: {
  'apps/server': { backend: { exports: ['@acme/server/client'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `exports` | `string[]` | `<package>/client` | Public entry points other folders may import |

Rules: [`arch/boundaries-rpc-database`](../rules/boundaries-rpc-database.md).

Plus `eslint` (1).
