# arch/boundaries-next

Reports server-only imports in any module that is not `.server`, `.rsc`, an action or `'use server'`, server globals in client or shared modules, browser imports, globals and client hooks in `.server`, `.rsc` and `'use server'` modules, mismatched directives, and `.action` files without `'use server'`.

```ts
// ❌ session.server.ts
export const width = () => window.innerWidth

// ✅ session.server.ts
import { cookies } from 'next/headers'

export const session = async () => (await cookies()).get('session')
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `web` | `string[]` | `[]` | Frontend root directories |
| `backend` | `string[]` | `[]` | Backend root directories |
| `aliases` | `Record<string, string>` | `{}` | Import prefix to directory |
| `backendPackages` | `string[]` | `[]` | Package names that count as server imports |
| `server` | `string[]` | none | Extra server-only import prefixes |
| `client` | `string[]` | none | Extra browser-only import prefixes |
| `dynamic` | `string[]` | none | Absolute paths of files allowed to use non-literal `import()` |
| `serverPackages` | `string[]` | `['@orpc/server', 'react-dom/server', 'server-only', 'next/headers', 'next/cache', 'next/server']` | Server-only packages; a subpath or `.` suffix matches too. Replaces the default. Node built-ins and `node:`, `bun:` and `cloudflare:` specifiers are always server-only |
| `clientPackages` | `string[]` | `['client-only', 'react-dom/client']` | Browser-only packages and their subpaths. Replaces the default |
| `hookPackages` | `string[]` | `['react']` | Packages whose `use*` exports are client hooks |
| `serverHooks` | `string[]` | `['useId', 'use']` | Hooks from `hookPackages` that server and RSC modules may use. Replaces the default |
| `publicEnv` | `string` | `'NEXT_PUBLIC_'` | `process.env` prefix that browser modules may read |
| `conventions` | `object` | see below | File and folder names the checks read |

`conventions` keys, each replacing its default:

| Key | Default | |
| --- | --- | --- |
| `server` | `['server']` | Server module suffixes, also server-only import targets |
| `rsc` | `['rsc']` | RSC module suffixes, also server-only import targets |
| `actions` | `['action']` | Server action suffixes; they need `'use server'` |
| `client` | `['client']` | Client module suffixes |
| `clientOnly` | `['client-only']` | Browser-only file suffixes |
| `hooks` | `['hooks']` | Folders whose files are browser-only |
| `shared` | `['utils', 'constants']` | Shared module suffixes that may hold no server import |
| `lib` | `'lib'` | Shared folder under each `web` root; its files may hold no server import unless they are server modules themselves (`.server`, `.rsc`, an action or `'use server'`) |

```ts
'arch/boundaries-next': ['error', {
  web: [resolve('apps/web/src')],
  backend: [resolve('apps/server/src')],
  aliases: {},
  backendPackages: ['@app/server'],
  server: ['@app/db'],
}]
```
