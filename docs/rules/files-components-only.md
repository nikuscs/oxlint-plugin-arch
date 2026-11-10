# arch/files-components-only

Reports exports that are not React components or types, and each component whose name does not start with the file name.

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
| `filename` | `boolean \| 'each'` | `true` | Component name must match the file name in PascalCase, split on `-` and `.`. With `true`, one exact match or a shared prefix covers every component; `'each'` checks every component |
| `roles` | `string[]` | `[]` | Role suffixes dropped from the name, like `view` in `user.view.tsx` |
| `types` | `boolean` | `true` | Allow type exports |
| `deny` | `string \| string[]` | none | Type export names to reject |

```ts
'arch/files-components-only': ['error', { roles: ['view', 'page'] }]
```
