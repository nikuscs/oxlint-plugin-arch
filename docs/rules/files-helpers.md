# arch/files-helpers

Reports top-level functions and `const` function values that are not components, hooks or allowed names. Exported helpers are reported; functions inside another function are ignored.

```tsx
// ❌ user-card.tsx
function formatName(name: string) {
  return name.trim()
}
export function UserCard({ name }: { name: string }) {
  return <div>{formatName(name)}</div>
}

// ✅ user-card.tsx
export function UserCard({ name }: { name: string }) {
  return <div>{name.trim()}</div>
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allow` | `string \| string[]` | none | Regexes on names (local or exported) to allow |
| `message` | `string` | `'Keep this helper inside its owning component or hook.'` | Report text |
| `components` | `boolean` | `true` | Allow React components |
| `hooks` | `string \| string[]` | `'^use[A-Z]'` | Regexes on names treated as hooks; replaces the default |

```ts
'arch/files-helpers': ['error', { allow: '^format[A-Z]' }]
```
