# arch/files-no-functions

Reports top-level functions and value re-exports.

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
| `banReExports` | `boolean` | `true` | Also report `export ... from` |
| `allowPattern` | `string \| string[]` | none | Function names to allow |

```ts
'arch/files-no-functions': ['error', { allowPattern: '^is[A-Z]' }]
```
