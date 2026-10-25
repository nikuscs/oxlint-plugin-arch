# arch/boundaries-next

Reports server-only imports and globals in client or shared modules, browser imports, globals and client hooks in `.server`, `.rsc` and `'use server'` modules, mismatched directives, and `.action` files without `'use server'`.

```ts
// ❌ session.server.ts
export const width = () => window.innerWidth

// ✅ session.server.ts
import { cookies } from 'next/headers'

export const session = async () => (await cookies()).get('session')
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `web` | `string[]` | required | Frontend root directories |
| `backend` | `string[]` | required | Backend root directories |
| `aliases` | `Record<string, string>` | required | Import prefix to directory |
| `backendPackages` | `string[]` | required | Package names that count as server imports |
| `serverImports` | `string[]` | none | Extra server-only import prefixes |
| `clientImports` | `string[]` | none | Extra browser-only import prefixes |
| `allowComputedImportsIn` | `string[]` | none | Files allowed to use non-literal `import()` |

```ts
'arch/boundaries-next': ['error', {
  web: [resolve('apps/web/src')],
  backend: [resolve('apps/server/src')],
  aliases: {},
  backendPackages: ['@app/server'],
  serverImports: ['@app/db'],
}]
```
