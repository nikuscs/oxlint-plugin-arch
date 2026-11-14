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
| `only` | `{ imports?, calls?, in, message? }[]` | `[]` | Imports and calls used in the `in` places only |

## Only here

`only` says where something may be used, instead of banning it everywhere and lifting the ban folder by folder. `imports`, `calls` and `in` each take one value or a list; every import is paired with every place. A place is a folder or a file glob. Children add entries to their parent's list.

```ts
'apps/server/src': {
  deny: {
    only: [
      { imports: ['@scope/kit-auth', '@scope/kit-auth/*'], in: ['apps/server/src/domains/auth', 'apps/server/src/application'], message: 'Call the auth domain.' },
      { calls: ['insertInto', 'updateTable'], in: 'apps/server/src/domains/*/*.actions.ts' },
    ],
  },
},
```

With a [set](../folders.md#-sets), `each` runs one entry per pair: `{ each: 'kits', imports: '@scope/{key}', in: 'apps/server/src/domains/{value}' }`.

Backend query files also get the built-in write calls of [`backend`](backend.md); `false` on a file key for those files drops one.

Rules: [`arch/boundaries-deny`](../rules/boundaries-deny.md).
