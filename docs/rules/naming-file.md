# arch/naming-file

Reports files whose name does not match `pattern`. With `unique`, also reports files whose `unique` match (first group, or the whole match) repeats in another file of the same folder that `pattern` accepts. Pass several option objects to run several checks; a file must pass each one.

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
| `flags` | `string` | none | Flags for `pattern` |
| `unique` | `string` | none | Regex for the part that must be unique per folder |

```ts
'arch/naming-file': ['error', { pattern: '^[a-z0-9-]+(\\.[a-z]+)*\\.tsx?$', message: 'Use kebab-case file names.' }]
'arch/naming-file': [
  'error',
  { pattern: '^[a-z0-9-]+\\.ts$', message: 'Use kebab-case file names.' },
  { pattern: '^\\d{3}-', message: 'Start with NNN-.', unique: '^(\\d{3})-' },
]
```
