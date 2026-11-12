# arch/files-route

Reports route file exports other than `Route`, and route adapters (unexported top-level functions) that call banned hooks or render intrinsic JSX.

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
| `inspect` | `boolean` | `false` | Also inspect the function exported as `export`; other allowed exports are not inspected |
| `hooks` | `string[]` | `['useState', 'useEffect', 'useMutation']` | Hooks adapters must not call; replaces the default |
| `intrinsic` | `boolean` | `true` | Report lowercase JSX like `<div>` |

```ts
'arch/files-route': ['error', { exports: ['loader'], hooks: ['useState', 'useEffect'] }]
'arch/files-route': ['error', { export: 'default', exports: ['generateMetadata', 'metadata'], inspect: true }]
```
