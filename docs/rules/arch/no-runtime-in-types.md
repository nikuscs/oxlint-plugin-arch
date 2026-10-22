# `arch/no-runtime-in-types`

Keeps type modules free of runtime declarations. You can also ban runtime imports and re-exports.

## Why

A types file should export types, not values. Runtime code in `*.types.ts` mixes compile-time contracts with executable modules.

## Examples

❌ Incorrect

```ts
// apps/web/src/types/account.types.ts
export const accountId = 'account'
export enum AccountState {
  Active,
}
```

```ts
import { value } from './values'
export { value } from './values'
```

✅ Correct

```ts
// apps/web/src/types/account.types.ts
export interface Account {
  id: string
}
export type AccountId = string
export declare const accountId: string
```

```ts
import type Client from './client'
import { type Input, type Output } from './contracts'
export type { Input } from './contracts'
```

Ambient `.d.ts` / `.d.mts` / `.d.cts` files may contain value-shaped declarations. Type-only namespaces pass. Namespaces that export runtime values fail.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allow` | `('class' \| 'default' \| 'enum' \| 'function' \| 'variable')[]` | `[]` | Runtime declaration kinds to leave alone. |
| `runtimeImports` | `'allow' \| 'ban'` | `'allow'` | Ban value imports (including `import x = require(...)` and side-effect imports). |
| `allowImportSources` | `string[]` | `[]` | Regexes for import sources still allowed when `runtimeImports` is `'ban'`. |
| `banReExports` | `boolean` | `false` | Ban runtime re-exports (`export { value } from`, `export *`, exporting an imported value). Type-only re-exports pass. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-runtime-in-types': [
    'error',
    {
      runtimeImports: 'ban',
      allowImportSources: [],
      banReExports: true,
    },
  ],
}
```

## Preset

Preset: `typePlacement` policy, on web `types/**/*.types.ts` (TanStack web when there is no backend), with `{ runtimeImports: 'ban', allowImportSources: [], banReExports: true }`.

## Related

- [`arch/no-type-declarations`](./no-type-declarations.md)
- [`arch/no-imported-type-alias`](./no-imported-type-alias.md)
