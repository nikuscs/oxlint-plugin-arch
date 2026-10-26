# 🚫 deny

Imports and calls a folder may not use. Children add to their parent's list; `false` drops an inherited entry. On by default, empty.

```ts
folders: {
  '.': { deny: { imports: { 'framer-motion': 'Use motion/react.' } } },
  'apps/server/src/services': { deny: { imports: { '#/core/core.services': 'Services never import the registry.' } } },
  'apps/server/tests': { deny: { imports: { '**/kits': 'Import the kit file.' } } },
  'apps/server/src/rpc': { deny: { calls: { transaction: 'RPC delegates to services.' } } },
  'apps/web': { deny: { imports: { 'framer-motion': false } } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `imports` | `Record<string, string \| false>` | `{}` | Specifier glob → hint; covers static, re-export and literal dynamic imports |
| `calls` | `Record<string, string \| false>` | `{}` | Callee, member or dotted name → hint |

Backend query files also get the `backend.writes` calls.

Rules: [`arch/boundaries-deny`](../rules/boundaries-deny.md).
