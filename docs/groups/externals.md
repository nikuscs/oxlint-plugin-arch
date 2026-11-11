# 📦 externals

Server bundle externals match `package.json`, in `vite.config.*` and `next.config.*`. On by default.

```ts
import { externals, preset } from 'oxlint-plugin-arch/preset'

folders: {
  'apps/web/vite.config.ts': { rules: { 'arch/files-externals': ['error', { packages: [...externals, 'ai', 'stripe'] }] } },
  'apps/docs/next.config.ts': { rules: { 'arch/files-externals': ['error', { packages: externals.filter((name) => name !== 'pg') }] } },
  'apps/spa': { externals: false },
}
```

Takes `true`, `false` or `'warn'`. The rule gets the `externals` list.

`externals` = `@napi-rs/*`, `@node-rs/*`, `@takumi-rs/*`, `sharp`, `pg`, `ioredis`, `bullmq`, `tiny-secp256k1`, `ssh2`, `playwright`, `playwright-core`: native or Node-only packages that break when bundled.

Rules: [`arch/files-externals`](../rules/files-externals.md).
