# `arch/no-top-level-functions`

Rejects top-level function declarations and function-valued variables, with an option to reject re-exports.

## Why

Data-only modules should not hide runtime behavior. Re-export control can also keep these files from becoming runtime barrels.

## Examples

❌ Incorrect

```ts
// apps/server/src/types/layout.constants.ts
export function getLayout() { return 1 }
```

✅ Correct

```ts
// apps/server/src/types/layout.constants.ts
export const layout = 'wide'
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `banReExports` | `boolean` | `true` | Rejects `export ... from` and `export * from` declarations. |
| `allowPattern` | `string \| string[]` | None | Regular expressions for top-level function names to allow. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-top-level-functions': ['error', {
    banReExports: false,
  }],
}
```

## Preset

Preset: `typePlacement` policy, on schema-owner type files, configured colocated type files, and app constant files, with re-exports allowed.

## Related

- [`arch/only-export-constants`](./only-export-constants.md)
- [`arch/no-file-level-helpers`](./no-file-level-helpers.md)
- [`arch/no-module-mutable-state`](./no-module-mutable-state.md)
