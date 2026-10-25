# arch/naming-types

Reports interfaces whose name is not PascalCase.

```ts
// ❌
interface user_props { id: string }

// ✅
interface UserProps { id: string }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | built-in text | Report text |

```ts
'arch/naming-types': ['error', { message: 'Use PascalCase for interfaces.' }]
```
