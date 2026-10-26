# arch/boundaries-tanstack

Reports server-only imports, globals and RSC renderers used outside a `createServerFn().handler`, `createServerOnlyFn` or `.server()` boundary, browser-only imports in `.server`, `.rsc` and shared modules, client hooks in `.server` and `.rsc` modules, and browser globals in those modules or inside a server boundary.

Server files may own static server imports, but cannot use them inside an explicit client-only callback. The innermost execution boundary determines ownership.

```ts
// ❌ routes/notes.ts
import { readFile } from 'node:fs/promises'

export const loadNotes = () => readFile('notes.md', 'utf8')

// ✅ routes/notes.ts
import { createServerFn } from '@tanstack/react-start'
import { readFile } from 'node:fs/promises'

export const loadNotes = createServerFn().handler(() => readFile('notes.md', 'utf8'))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `web` | `string[]` | `[]` | Frontend root directories |
| `backend` | `string[]` | `[]` | Backend root directories |
| `aliases` | `Record<string, string>` | `{}` | Import prefix to directory |
| `backendPackages` | `string[]` | `[]` | Package names that count as server imports |
| `rpc` | `string[]` | `[]` | Files allowed to statically import server code for `createIsomorphicFn` |
| `server` | `string[]` | none | Extra server-only import prefixes |
| `client` | `string[]` | none | Extra browser-only import prefixes |
| `dynamic` | `string[]` | none | Files allowed to use non-literal `import()` |
| `serverPackages` | `string[]` | `['@orpc/server', 'react-dom/server', '@tanstack/{react,solid,vue}-start/server', '@tanstack/{react,solid,vue}-start/server-only']` | Server-only packages; a subpath or `.` suffix matches too. Replaces the default |
| `clientPackages` | `string[]` | `['react-dom/client', '@tanstack/{react,solid,vue}-start/client-only']` | Browser-only packages and their subpaths. Replaces the default |
| `hookPackages` | `string[]` | `['react', '@tanstack/react-query', '@tanstack/react-router']` | Packages whose `use*` exports are client hooks |
| `startPackages` | `string[]` | `['@tanstack/react-start']` | Packages that export `createServerFn` and the other boundary factories |
| `rscPackages` | `string[]` | `['@tanstack/react-start/rsc', '@tanstack/react-start-rsc']` | Packages that export the RSC renderers |

```ts
'arch/boundaries-tanstack': ['error', {
  web: [resolve('apps/web/src')],
  backend: [resolve('apps/server/src')],
  aliases: {},
  backendPackages: ['@app/server'],
  rpc: [resolve('apps/web/src/rpc/client.ts')],
}]
```
