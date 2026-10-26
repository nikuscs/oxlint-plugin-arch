# arch/files-components-only

Reports exports that are not React components or types, and components whose name does not match the file name.

```tsx
// ❌ user-card.tsx
export function UserCard() {
  return <div />
}
export const formatName = (name: string) => name.trim()

// ✅ user-card.tsx
export function UserCard() {
  return <div />
}
export type UserCardProps = { name: string }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `filename` | `boolean` | `true` | Component name must match the file name in PascalCase, split on `-` and `.` |
| `roles` | `string[]` | `[]` | Role suffixes dropped from the name, like `view` in `user.view.tsx` |
| `types` | `boolean` | `true` | Allow type exports |
| `deny` | `string \| string[]` | none | Type export names to reject |

```ts
'arch/files-components-only': ['error', { roles: ['view', 'page'] }]
```
