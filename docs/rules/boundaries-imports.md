# arch/boundaries-imports

Reports imports, re-exports and literal dynamic imports that cross a configured boundary: frontend to non-public backend modules, packages to app internals, runtime imports into types or constants files, UI packages in `.client.ts` services, and private domain files used from another domain.

```ts
// ❌ apps/web/src/chat.ts
import { chats } from '@app/server/db/chats'

// ✅ apps/web/src/chat.ts
import { chatClient } from '@app/server/client'
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `web` | `string[]` | `[]` | Frontend root directories |
| `backend` | `string[]` | `[]` | Backend root directories |
| `packages` | `string \| string[]` | `[]` | Shared package roots |
| `backendPackages` | `string[]` | `[]` | Package names that count as backend imports |
| `appPackages` | `string[]` | `[]` | App package names shared packages must not import |
| `entrypoints` | `string[]` | `[]` | Backend modules the frontend may import |
| `aliases` | `Record<string, string>` | `{}` | Import prefix to directory |
| `roles` | `string[]` | none | Extra private file suffixes, like `prompts` |
| `uiPackages` | `string[]` | `['react', 'react-dom']` | Packages `.client.ts` services may not import at runtime |
| `portable` | `boolean` | `false` | `<web>/lib` may not import app services or app types |

```ts
'arch/boundaries-imports': ['error', {
  web: [resolve('apps/web/src')],
  backend: [resolve('apps/server/src')],
  packages: [resolve('packages')],
  backendPackages: ['@app/server'],
  appPackages: ['@app/web', '@app/server'],
  entrypoints: ['@app/server/client'],
  aliases: { '@server': resolve('apps/server/src') },
}]
```
