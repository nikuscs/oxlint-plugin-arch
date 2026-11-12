# arch/naming-types

Reports interfaces whose name does not match `pattern`, PascalCase by default. Type aliases are not checked.

```ts
// ❌
interface user_props { id: string }

// ✅
interface UserProps { id: string }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `pattern` | `string \| string[]` | `'^[A-Z][a-zA-Z0-9]*$'` | Regexes an interface name must match |
| `message` | `string` | `'Use PascalCase for interfaces.'` | Report text. Set it when you change `pattern` |

```ts
'arch/naming-types': ['error', { message: 'Use PascalCase for interfaces.' }]
'arch/naming-types': ['error', { pattern: '^I[A-Z]', message: 'Prefix interfaces with I.' }]
```
