# `modules/next-runtime`

Preset-internal rule: check Next.js runtime ownership from file names and directives. `.server` / `.rsc` and `'use server'` modules stay off the browser. `.client` and `'use client'` modules stay off server-only APIs. Shared modules use neither.

## Why

A module's runtime comes from its name and directives: `.server`, `.rsc` and `.action` files, and files starting with `'use server'`, are server modules. `.client` files and files starting with `'use client'` are client modules. `.utils`, `.constants` and `lib/` files are shared.

Server-only dependencies are Node builtins (bare and `node:`), Bun/Cloudflare modules, `server-only`, `next/headers`, `next/cache`, `next/server`, `react-dom/server`, `@orpc/server`, configured backend server/RPC APIs and `.server` / `.rsc` targets. They are allowed only in server modules. Browser-only dependencies (`client-only`, `react-dom/client`, `hooks/` and `.client-only` targets) and React hooks other than `use` and `useId` are rejected in server modules. Shared modules accept neither side. Server globals are rejected in client and shared modules, except `process.env.NEXT_PUBLIC_*`. Browser globals are rejected in server modules. Client modules may import server actions from `.action` files, which must start with `'use server'`. A `'use client'` directive in a server-named file, or `'use server'` in a `.client` file, is reported. Type-only imports and re-exports are ignored.

Like the TanStack rule, this is direct syntax enforcement, not an import graph. Keep `server-only` / `client-only` and the bundler's own checks in place.

## Examples

❌ Incorrect

```ts
// apps/web/src/services/chat/chat.client.ts
import { cookies } from 'next/headers'
export const chatRead = () => cookies()
```

```ts
// apps/web/src/services/chat/chat.server.ts
import { useState } from 'react'
export function chatState() {
  return useState(0)
}
```

```ts
// apps/web/src/services/chat/chat.action.ts
export async function chatSave() {}
```

✅ Correct

```ts
// apps/web/src/services/chat/chat.server.ts
import { cookies } from 'next/headers'
export async function chatSession() {
  return (await cookies()).get('s')
}
```

```ts
// apps/web/src/services/chat/chat.action.ts
'use server'
import { revalidatePath } from 'next/cache'
export async function chatSave() {
  revalidatePath('/')
}
```

```ts
// apps/web/src/services/chat/chat.client.ts
import { chatSave } from './chat.action'
export function chatSubmit() {
  return chatSave()
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `web` | `string[]` | required | Frontend roots. Shared `lib/` is detected under these. |
| `backend` | `string[]` | required | Backend roots treated as server imports. |
| `aliases` | `Record<string, string>` | required | Import prefix to directory map. |
| `backendPackages` | `string[]` | required | Backend package names. |
| `serverImports` | `string[]` | `[]` | Extra server-only package/module prefixes. |
| `clientImports` | `string[]` | `[]` | Extra client-only package/module prefixes. |
| `allowComputedImportsIn` | `string[]` | `[]` | Exact files allowed to use computed `import(path)`. Review all targets first. |

```ts
// oxlint.config.ts
rules: {
  'modules/next-runtime': ['error', {
    web: ['apps/web/src'],
    backend: ['apps/server/src'],
    aliases: {},
    backendPackages: ['@app/server'],
  }],
}
```

The preset maps `next.additionalServerOnlyImports`, `additionalClientOnlyImports` and `computedImportAllowedFiles` onto these options.

## Preset

Preset: `boundaries` policy, on Next web `services/**/*.{ts,tsx}` and `lib/**/*.{ts,tsx}`. Replaces `modules/tanstack-runtime` for those roots.

## Related

- [`modules/tanstack-runtime`](./tanstack-runtime.md)
- [`modules/import-boundaries`](./import-boundaries.md)
