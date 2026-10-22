# `modules/import-boundaries`

Preset-internal rule: reject imports that cross configured application boundaries, including type-only imports.

## Why

Frontend code may use only public backend entry points. Shared packages must not import app internals. Service files must not read the service registry at runtime. Domain types and constants must use type-only imports from implementations. `.client.ts` services must not import `react` or `react-dom`.

With `fileRoles`, private domain files stay in the same domain and app. Public `.service` / `.client` / `.server` / `.rsc` / `.utils` surfaces must not re-export those internals. With `portableLib`, files under a web root's `lib/` must not import app services or app APIs. They may type-import only their own `types/<stem>.types.ts` contract.

Static imports, re-exports, literal dynamic imports and (for portable lib) TypeScript import types are checked. Computed imports and arbitrary alias data flow are not resolved.

## Examples

❌ Incorrect

```ts
// apps/web/src/types/chat.types.ts
import type { Chat } from '@backend/types/chat.types'
```

```ts
// packages/logger/src/index.ts
import { chat } from '@app/web/internal'
```

```ts
// apps/web/src/lib/fade.ts
import type { FadeOptions } from '@/types/chat.types'
import { fade } from '@/lib/../services/fade/fade.utils'
```

✅ Correct

```ts
// apps/web/src/types/chat.types.ts
import type { Chat } from '@app/server/client'
```

```ts
// apps/web/src/lib/fade.ts
import type { FadeOptions } from '@/types/fade.types'
```

## Options

All listed fields except `fileRoles` and `portableLib` are required.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `web` | `string[]` | required | Frontend root directories. |
| `backend` | `string[]` | required | Backend root directories. |
| `packages` | `string` or `string[]` | required | Shared package roots. |
| `backendPackages` | `string[]` | required | Backend package names treated as server imports. |
| `appPackages` | `string[]` | required | App package names packages must not import. |
| `publicEntrypoints` | `string[]` | required | Backend modules the frontend may import. |
| `aliases` | `Record<string, string>` | required | Import prefix to directory map. |
| `fileRoles` | `string[]` | unset | Extra private concept suffixes such as `prompts`. |
| `portableLib` | `boolean` | `false` | Enforce portable `lib/` ownership. |

```ts
// oxlint.config.ts
rules: {
  'modules/import-boundaries': ['error', {
    web: ['apps/web/src'],
    backend: ['apps/server/src'],
    packages: ['packages'],
    backendPackages: ['@app/server'],
    appPackages: ['@app/web', '@app/server'],
    publicEntrypoints: ['@app/server/client'],
    aliases: { '@backend': 'apps/server/src' },
    portableLib: true,
    fileRoles: ['prompts'],
  }],
}
```

A file-specific `ruleExclusions['modules/import-boundaries']` skips this entire check for that file. Keep exclusions narrow.

## Preset

Preset: `boundaries` policy, on app files and package source. Sets `portableLib: true` and `fileRoles` from `modules.customFileRoles`.

## Related

- [`modules/tanstack-runtime`](./tanstack-runtime.md)
- [`modules/next-runtime`](./next-runtime.md)
