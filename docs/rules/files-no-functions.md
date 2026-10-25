# arch/files-no-functions

Reports top-level functions, including `export default` function expressions, and value re-exports.

```ts
// ❌ money.ts
export function toCents(value: number) {
  return value * 100
}
export * from './currency.ts'

// ✅ money.ts
export const CENTS_PER_UNIT = 100
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `reexports` | `boolean` | `true` | Also report `export ... from` |
| `allow` | `string \| string[]` | none | Function names to allow |

```ts
'arch/files-no-functions': ['error', { allow: '^is[A-Z]' }]
```
