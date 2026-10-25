# arch/naming-file

Reports files whose name does not match `pattern`.

```ts
// ❌
// components/UserCard.tsx

// ✅
// components/user-card.tsx
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `pattern` | `string \| string[]` | required | Regex the file name must match |
| `message` | `string` | required | Report text |
| `flags` | `string` | none | Regex flags |

```ts
'arch/naming-file': ['error', { pattern: '^[a-z0-9-]+(\\.[a-z]+)*\\.tsx?$', message: 'Use kebab-case file names.' }]
```
