# arch/files-route

Reports route file exports other than `Route`, and route adapters that call banned hooks or render intrinsic JSX.

```tsx
// ❌ routes/users.tsx
export const Route = createFileRoute('/users')({ component: UsersRoute })
function UsersRoute() {
  const [query] = useState('')
  return <div>{query}</div>
}

// ✅ routes/users.tsx
export const Route = createFileRoute('/users')({ component: UsersRoute })
function UsersRoute() {
  return <UsersPage />
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `export` | `string` | `'Route'` | The one export the file needs |
| `exports` | `string[]` | `[]` | Other exports to allow |
| `inspect` | `boolean` | `false` | Also inspect exported route functions |
| `hooks` | `string[]` | `['useState', 'useEffect', 'useMutation']` | Hooks adapters must not call |
| `intrinsic` | `boolean` | `true` | Report lowercase JSX like `<div>` |

```ts
'arch/files-route': ['error', { exports: ['loader'], hooks: ['useState', 'useEffect'] }]
```
