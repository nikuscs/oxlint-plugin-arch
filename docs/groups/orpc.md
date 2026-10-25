# 🔌 orpc

oRPC procedures declare outputs. Opt-in.

```ts
folders: {
  'apps/server': { orpc: { public: ['apps/server/src/rpc/api/**'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `public` | `string[]` | `[]` | Public procedure globs |
| `composers` | `string[]` | `[]` | Output schema helpers that count as `.output()` |
| `client` | `string` | `services/rpc.client.ts` | The one file that owns `RouterClient` |

Rules: [`arch/backend-orpc-output`](../rules/backend-orpc-output.md).
