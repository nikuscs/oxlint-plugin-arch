# arch/files-types-only

Reports runtime values in types files: variables, functions, classes, enums, default exports and value namespaces.

```ts
// ❌ user.types.ts
export const DEFAULT_ROLE = 'member'
export interface User { id: string }

// ✅ user.types.ts
export interface User { id: string }
export type Role = 'member' | 'admin'
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allow` | `('class' \| 'default' \| 'enum' \| 'function' \| 'variable')[]` | `[]` | Runtime kinds to allow |
| `imports` | `'allow' \| 'ban'` | `'allow'` | Report value imports |
| `sources` | `string[]` | `[]` | Import source regexes allowed when banning |
| `reexports` | `boolean` | `false` | Report value re-exports |

```ts
'arch/files-types-only': ['error', { allow: ['enum'], imports: 'ban' }]
```
