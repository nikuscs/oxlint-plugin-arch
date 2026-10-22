# Frameworks

Each web root picks `tanstack-start` (default) or `next` (App Router). Back to the [preset overview](README.md).

| Preset | Default framework |
| --- | --- |
| `tanstackStartReactModulesPreset` | `tanstack-start` |
| `nextReactModulesPreset` | `next` |
| `reactModulesPreset` | top-level `framework`, else `tanstack-start` |

```ts
import { reactModulesPreset } from 'oxlint-plugin-arch/presets';

export default reactModulesPreset({
  root: import.meta.dirname,
  architecture: {
    'apps/dashboard': { role: 'web', framework: 'tanstack-start' },
    'apps/site': { role: 'web', framework: 'next' },
    'apps/api': 'server',
  },
});
```

Standalone Next app: `nextReactModulesPreset({ root: import.meta.dirname, architecture: { '.': 'web' } })`.

## What changes per framework

| | TanStack Start | Next |
| --- | --- | --- |
| Routes | `routes/**/*.{ts,tsx}` export `Route` | `app/**` pages, layouts, `route.ts` (below) |
| Route handlers | `routes/handlers/**/*.ts`, helpers nested | `app/**/route.ts`, helpers nested |
| Runtime rule | [`modules/tanstack-runtime`](../rules/modules/tanstack-runtime.md) | [`modules/next-runtime`](../rules/modules/next-runtime.md) |
| Stylesheet | `<source>/application/styles.css` | `<source>/app/globals.css` |
| Server actions | | `services/**/*.action.ts` with `'use server'` |
| Ignored | | `.next/**`, `next-env.d.ts` |

Everything else is shared: services, RPC owner, hooks, types, constants, backend roles.

## Next App Router files

| Files | Exports | Rules |
| --- | --- | --- |
| `page`, `template`, `default`, `not-found`, `forbidden`, `unauthorized`, `loading` (`.tsx`) | `default` + metadata and segment config | No `useState`/`useEffect`/`useMutation`, no raw HTML |
| `layout`, `global-not-found`, root `app/not-found` (`.tsx`) | same | Same hook ban; may render `<html>`/`<body>` |
| `route.ts` | HTTP methods + segment config | Helpers inside the handler or in a service |

Allowed extra exports: `generateMetadata`, `metadata`, `generateViewport`, `viewport`, `generateStaticParams`, `dynamic`, `dynamicParams`, `revalidate`, `fetchCache`, `runtime`, `preferredRegion`, `maxDuration`.

```tsx
// ✅ app/chat/page.tsx
export const metadata = { title: 'Chat' }

export default function ChatPage() {
  return <ChatPanel />
}

// ❌ app/chat/page.tsx
export default function ChatPage() {
  const [text, setText] = useState('')
  return <div>{text}</div>
}
```

```ts
// ✅ app/api/health/route.ts
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ ok: true })
}

export { GET as HEAD }
```
