# arch/files-components-only

Reports exports that are not React components or types, and components whose names do not fit the file name (see `filename`). A component is a capitalized function or `const` that returns JSX or `null`, or a `memo`, `forwardRef` or `lazy` wrapper of one.

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
| `filename` | `boolean \| 'each'` | `true` | Component name must match the file name in PascalCase, split on `-` and `.`. With `true`, one exact match or a shared prefix covers every component; `'each'` checks every component; `false` skips the check |
| `roles` | `string[]` | `[]` | Role suffixes dropped from the expected name, like `view` in `user.view.tsx`; the full name still passes |
| `types` | `boolean` | `true` | Allow type exports |
| `deny` | `string \| string[]` | none | Regexes on type export names to reject; ignored when `types` is `false` |

```ts
'arch/files-components-only': ['error', { roles: ['view', 'page'] }]
```
