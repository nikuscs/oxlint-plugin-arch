# arch/boundaries-tanstack

Reports server-only imports, globals and RSC renderers used outside a `createServerFn().handler`, `createServerOnlyFn` or `.server()` boundary, and browser imports, globals and client hooks in `.server`, `.rsc` and shared modules.

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
| `web` | `string[]` | required | Frontend root directories |
| `backend` | `string[]` | required | Backend root directories |
| `aliases` | `Record<string, string>` | required | Import prefix to directory |
| `backendPackages` | `string[]` | required | Package names that count as server imports |
| `rpcClients` | `string[]` | required | Files allowed to statically import server code for `createIsomorphicFn` |
| `serverImports` | `string[]` | none | Extra server-only import prefixes |
| `clientImports` | `string[]` | none | Extra browser-only import prefixes |
| `allowComputedImportsIn` | `string[]` | none | Files allowed to use non-literal `import()` |

```ts
'arch/boundaries-tanstack': ['error', {
  web: [resolve('apps/web/src')],
  backend: [resolve('apps/server/src')],
  aliases: {},
  backendPackages: ['@app/server'],
  rpcClients: [resolve('apps/web/src/rpc/client.ts')],
}]
```
