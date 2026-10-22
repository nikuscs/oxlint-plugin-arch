# `modules/tanstack-runtime`

Preset-internal rule: check direct runtime dependencies and imported TanStack execution boundaries. Compilation still owns graph isolation.

## Why

The rule runs on each configured TanStack web root's services and lib. Server dependencies include Node builtins (bare and `node:`), Bun/Cloudflare modules, `@orpc/server`, configured backend server/RPC APIs, `.server` files, TanStack server APIs/markers and React DOM server rendering. Known RSC renderer imports are checked by symbol. The entire mixed RSC package is not banned. Pure public backend client/schema imports remain under architecture rules such as [`modules/import-boundaries`](./import-boundaries.md).

`.client.ts` is the preset's frontend-facing, potentially SSR-used service convention. Known server runtime dependencies require inline callbacks of scope-resolved imports of `createServerFn().handler`, `createServerOnlyFn`, `createMiddleware().server` or `createIsomorphicFn().server`. Alias and namespace imports are recognized. Lookalike names and shadowed parameters are not. Static isomorphic server imports are allowed only in the configured RPC owner, and every runtime reference must stay in its server branch. Elsewhere that branch can load a literal dynamic import. Module-level execution and re-exports do not inherit the exception.

`.server` files may statically import server implementation. Dynamic loading alone proves nothing. RSC permits JSX, React and server-component definitions, but server renderer/dependency references still require a server callback. Server/RSC modules reject browser globals, local hook imports, client-only markers/APIs and React/TanStack client hooks outside recognized client branches. `useId` is allowed. Global checks respect lexical shadowing and direct `globalThis.name` / literal-key access. Shared utilities, constants and `lib/` cannot launder known server or client-only imports. Type-only imports and re-exports erase at runtime but keep architecture restrictions.

This is direct syntax and lexical-reference enforcement, not an import graph, interprocedural alias analysis, sandbox, or proof of SSR safety. Wrapper factories, indirect callback references, re-exported framework factories and arbitrary computed member aliases are not recognized as boundary proofs.

TanStack environment functions remove opposite branches, and import protection checks the resulting graph. Start's default import protection treats `.client.*` as browser-only, unlike this preset's service convention. SSR consumers must configure its server file pattern (Orbs uses `server.files: []`). Keep build-side protection enabled. Lint does not replace it.

## Examples

❌ Incorrect

```ts
// apps/web/src/services/chat/chat.client.ts
import { readFileSync } from 'fs'
export const chatRead = () => readFileSync('file')
```

```ts
// apps/web/src/services/chat/chat.client.ts
import { read } from './chat.server'
export const chatRead = () => read()
```

```ts
// apps/web/src/services/chat/chat.server.ts
export const chatRead = () => window.location.href
```

✅ Correct

```ts
// apps/web/src/services/chat/chat.client.ts
import { createServerFn as serverFn } from '@tanstack/react-start'
import { read } from './chat.server'
export const chatRead = serverFn().handler(() => read())
```

```ts
// apps/web/src/services/chat/chat.server.ts
import { readFileSync } from 'node:fs'
export function chatRead() {
  return readFileSync('path')
}
```

```ts
// apps/web/src/services/chat/chat.client.ts
import type { Chat } from './chat.server'
export type ChatCopy = Chat
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `web` | `string[]` | required | Frontend roots. Shared `lib/` is detected under these. |
| `backend` | `string[]` | required | Backend roots treated as server imports. |
| `aliases` | `Record<string, string>` | required | Import prefix to directory map. |
| `backendPackages` | `string[]` | required | Backend package names. |
| `rpcClients` | `string[]` | required | Files allowed to statically import isomorphic server branches. |
| `serverImports` | `string[]` | `[]` | Extra server-only package/module prefixes. |
| `clientImports` | `string[]` | `[]` | Extra client-only package/module prefixes. |
| `allowComputedImportsIn` | `string[]` | `[]` | Exact files allowed to use computed `import(path)`. Review all targets first. |

```ts
// oxlint.config.ts
rules: {
  'modules/tanstack-runtime': ['error', {
    web: ['apps/web/src'],
    backend: ['apps/server/src'],
    aliases: {},
    backendPackages: ['@app/server'],
    rpcClients: ['apps/web/src/services/rpc/rpc.client.ts'],
  }],
}
```

The preset maps `tanstackStart.additionalServerOnlyImports`, `additionalClientOnlyImports` and `computedImportAllowedFiles` onto these options.

## Preset

Preset: `boundaries` policy, on TanStack web `services/**/*.{ts,tsx}` and `lib/**/*.{ts,tsx}`.

## Related

- [`modules/next-runtime`](./next-runtime.md)
- [`modules/import-boundaries`](./import-boundaries.md)
