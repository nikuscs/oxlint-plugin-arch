# 📦 externals

Server bundle externals match `package.json`, in `vite.config.*` and `next.config.*`. On by default.

```ts
import { externals, preset } from 'oxlint-plugin-arch/preset'

folders: {
  'apps/web': { externals: { packages: [...externals, 'ai', 'stripe'] } },
  'apps/docs': { externals: { packages: externals.filter((name) => name !== 'pg') } },
  'apps/spa': { externals: false },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `packages` | `string[]` | `externals` | Dependencies that must stay external |

`externals` = `@napi-rs/*`, `@node-rs/*`, `@takumi-rs/*`, `sharp`, `pg`, `ioredis`, `bullmq`, `tiny-secp256k1`, `ssh2`, `playwright`, `playwright-core`: native or Node-only packages that break when bundled.

Rules: [`arch/files-externals`](../rules/files-externals.md).
