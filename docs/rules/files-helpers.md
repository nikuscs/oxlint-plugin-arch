# arch/files-helpers

Reports top-level declarations that are not components, hooks or allowed names.

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
| `allowPattern` | `string \| string[]` | none | Names (local or exported) to allow |
| `message` | `string` | `'Keep this helper inside its owning component or hook.'` | Report text |
| `detectComponents` | `boolean` | `true` | Allow React components |
| `hookPattern` | `string \| string[]` | `'^use[A-Z]'` | Names treated as hooks |

```ts
'arch/files-helpers': ['error', { allowPattern: '^format[A-Z]' }]
```
