# arch/copy-dashes

Reports em dashes in strings, template literals and JSX text. Comments are ignored. Files without a dash are skipped before any visitor runs.

```tsx
// ❌
const title = 'Fast — and cheap'
const Hero = () => <h1>Ship it — today</h1>

// ✅
const title = 'Fast, and cheap'
const Hero = () => <h1>Ship it today</h1>
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `deny` | `string[]` | `['—']` | Characters to ban, e.g. add `'–'` |
| `message` | `string` | `'Use a comma, colon, period or parentheses instead.'` | Hint after the report |

```ts
'arch/copy-dashes': ['error', { deny: ['—', '–'] }]
```
