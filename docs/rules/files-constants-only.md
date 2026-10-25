# arch/files-constants-only

Reports exports that are not local `const` bindings with plain values: functions, classes, `let`, types and re-exports.

```ts
// ❌ limits.constants.ts
export const formatLimit = (value: number) => `${value} items`

// ✅ limits.constants.ts
export const MAX_ITEMS = 50
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allowFunctionValues` | `boolean` | `false` | Allow `const` bindings holding functions |
| `allowTypeExports` | `boolean` | `false` | Allow type and interface exports |
| `allowReExports` | `boolean` | `false` | Allow `export ... from` and imported bindings |

```ts
'arch/files-constants-only': ['error', { allowTypeExports: true }]
```
