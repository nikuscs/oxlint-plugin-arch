# `arch/route-surface`

Limits route files to configured exports and prevents route adapters from using banned hooks or intrinsic JSX.

## Why

Route files should stay as small adapters around page components and framework APIs. `allowedExports` admits framework metadata, while `inspectExports` also checks the exported route component.

## Examples

❌ Incorrect

```tsx
function RouteComponent() {
  useState(0)
  return <div />
}

export const Route = createFileRoute('/')({ component: RouteComponent })
```

✅ Correct

```tsx
import { ChatPage } from '@/components/chat/chat-page'

function RouteComponent() {
  const params = Route.useParams()
  return <ChatPage id={params.id} />
}

export const Route = createFileRoute('/chat')({ component: RouteComponent })
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `exportName` | `string` | `'Route'` | Names the required route export. |
| `allowedExports` | `string[]` | `[]` | Allows additional framework exports. |
| `inspectExports` | `boolean` | `false` | Also checks the function exported as `exportName`. |
| `bannedHooks` | `string[]` | `['useState', 'useEffect', 'useMutation']` | Lists calls that route adapter functions must not make. |
| `banIntrinsicJsx` | `boolean` | `true` | Rejects intrinsic JSX such as `<div>`, while allowing component JSX. |

```ts
// oxlint.config.ts
rules: {
  'arch/route-surface': ['error', {
    exportName: 'default',
    allowedExports: ['metadata'],
    inspectExports: true,
    bannedHooks: ['useState', 'useEffect'],
    banIntrinsicJsx: true,
  }],
}
```

## Preset

Preset: `routes` policy, on TanStack route files and Next App Router pages, layouts, special files, and route handlers, with framework-specific options.

## Related

- [`arch/only-export-components`](./only-export-components.md)
- [`arch/component-props`](./component-props.md)
