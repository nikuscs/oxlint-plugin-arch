# arch/files-constants-only

Reports exports that are not local `const` bindings that do not hold a function or class: functions, classes, `let`, types and re-exports. Default exports must be a local `const` identifier; enums, namespaces, `export default 10` and `export =` are reported.

```ts
// ❌ limits.constants.ts
export const formatLimit = (value: number) => `${value} items`

// ✅ limits.constants.ts
export const MAX_ITEMS = 50
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `functions` | `boolean` | `false` | Allow `const` bindings holding arrow or function expressions (function declarations stay reported) |
| `types` | `boolean` | `false` | Allow type and interface exports |
| `reexports` | `boolean` | `false` | Allow `export ... from` and imported bindings |

```ts
'arch/files-constants-only': ['error', { types: true }]
```
