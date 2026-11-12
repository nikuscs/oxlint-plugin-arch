# arch/files-types-only

Reports runtime values in types files: variables, functions, classes, enums, default exports and value namespaces. `declare` values and namespaces that hold only types pass; unexported runtime values are reported too.

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
| `allow` | `('class' \| 'default' \| 'enum' \| 'function' \| 'variable')[]` | `[]` | Runtime kinds to allow: `variable` (const, let, var), `function`, `class`, `enum`, `default` (`export default <expression>` and `export =`) |
| `imports` | `'allow' \| 'ban'` | `'allow'` | `'ban'` reports value imports, side-effect imports and `import x = require()`; type imports pass |
| `sources` | `string[]` | `[]` | Regexes (not anchored) on import sources that stay allowed when `imports` is `'ban'` |
| `reexports` | `boolean` | `false` | Report value re-exports, including `export *` and `export { x }` of a value import; `export type` passes |

```ts
'arch/files-types-only': ['error', { allow: ['enum'], imports: 'ban' }]
```
