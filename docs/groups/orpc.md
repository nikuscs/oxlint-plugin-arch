# 🔌 orpc

oRPC procedures declare outputs. On in the `backend` recipe.

```ts
folders: {
  'apps/server': { orpc: { public: ['apps/server/src/rpc/api/**'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `public` | `string[]` | each backend's `rpc/api/**` when it exists | Public procedure globs |
| `client` | `string` | each web app's `services/rpc/rpc.client.ts` (`services/rpc.client.ts` with `layout.services: 'flat'`) | Project-relative path of the one file that owns `RouterClient` |

Rules: [`arch/backend-orpc-output`](../rules/backend-orpc-output.md).
