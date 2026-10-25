# 🌴 tanstack

TanStack Start routes and server/client boundaries. Opt-in.

```ts
folders: {
  'apps/web': { tanstack: { server: ['pg'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `server` | `string[]` | `[]` | Extra server-only imports |
| `client` | `string[]` | `[]` | Extra client-only imports |
| `dynamic` | `string[]` | `[]` | Files allowed computed imports |

Rules: [`arch/boundaries-tanstack`](../rules/boundaries-tanstack.md), [`arch/files-helpers`](../rules/files-helpers.md), [`arch/files-route`](../rules/files-route.md).
