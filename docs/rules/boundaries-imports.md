# arch/boundaries-imports

Reports imports, re-exports and literal dynamic imports that cross a configured boundary: frontend to non-public backend modules, packages to app internals, runtime imports into types or constants files, UI packages in `.client.ts` services, private domain files used from another domain, services importing the registry at runtime (dependencies are injected), and a portable lib importing app services or types.

```ts
// ❌ apps/web/src/chat.ts
import { chats } from '@app/server/db/chats'

// ✅ apps/web/src/chat.ts
import { chatClient } from '@app/server/client'

// ❌ roles: ['prompts'], services/chat/chat.service.ts
import { prompt } from '../user/user.prompts.ts'

// ✅ a public surface
import { userService } from '../user/user.service.ts'
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `web` | `string[]` | `[]` | Frontend root directories |
| `backend` | `string[]` | `[]` | Backend root directories |
| `packages` | `string \| string[]` | `[]` | Shared package roots |
| `backendPackages` | `string[]` | `[]` | Package names that count as backend imports |
| `appPackages` | `string[]` | `[]` | App package names shared packages must not import |
| `entrypoints` | `string[]` | `[]` | Backend modules the frontend may import. Exact specifier, no prefix match |
| `aliases` | `Record<string, string>` | `{}` | Import prefix to directory |
| `roles` | `string[]` | none | Private file suffixes, like `prompts`. Without it the private-domain check is off |
| `surfaces` | `string[]` | `['service', 'client', 'server', 'rsc', 'utils']` | File suffixes of a domain's public surface, like `service` in `chat.service.ts`; other domain files are private once `roles` is set |
| `uiPackages` | `string[]` | `['react', 'react-dom']` | Packages `.client.ts` services (`conventions.clients`) may not import at runtime |
| `portable` | `boolean \| string` | `false` | `<web>/lib` (or `<web>/<folder>` when a string) may not import app services or app types; it may type-import its own `<web>/types/<name>.types.ts` |
| `services` | `string[]` | none | Absolute service folders, instead of `<root>/<conventions.services>`; needed when a root nests another (e.g. a portable lib folder is also a service folder) |
| `conventions` | `object` | see below | File and folder names the checks read |

`conventions` keys, each replacing its default:

| Key | Default | |
| --- | --- | --- |
| `services` | `'services'` | Service folder name under each root, also for the `#services/` import prefix |
| `registry` | `'service'` | Registry file in the service folder that services may not import at runtime |
| `types` | `'types'` | Folder of `<domain>.<types>.ts` contracts and of portable lib contracts |
| `lib` | `'lib'` | Portable folder when `portable` is `true` |
| `contracts` | `['types', 'constants']` | Contract file suffixes: they import implementations only as types, and stay public |
| `implementations` | `['service', 'utils']` | Implementation file suffixes contracts may not import at runtime |
| `implementationFolders` | `['core']` | Folders contracts may not import at runtime |
| `operations` | `['action', 'query']` | `<domain>-<operation>.<name>.ts` files: implementations, never public surfaces |
| `operationFolders` | `['actions', 'queries']` | Operation folders contracts may not import at runtime |
| `domainFiles` | `['action', 'query', 'driver']` | `<domain>-<infix>` files at the service root that belong to `<domain>` |
| `clients` | `['client']` | Service suffixes that may not import `uiPackages` at runtime |

The `@/` (web root) and `#/` (app root) prefixes resolve when no `aliases` entry matches.

```ts
'arch/boundaries-imports': ['error', {
  web: [resolve('apps/web/src')],
  backend: [resolve('apps/server/src')],
  packages: [resolve('packages')],
  backendPackages: ['@app/server'],
  appPackages: ['@app/web', '@app/server'],
  entrypoints: ['@app/server/client'],
  aliases: { '@server': resolve('apps/server/src') },
  roles: ['prompts'],
}]
'arch/boundaries-imports': ['error', { backend: [resolve('apps/server/src')], conventions: { services: 'domains', registry: 'registry' } }]
```
