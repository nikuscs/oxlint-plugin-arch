# `arch/require-object-params`

Requires checked functions to use a limited number of object-shaped parameters.

## Why

Named fields make call sites easier to read and change. `maxParams: 2` supports a common `(deps, params)` contract.

## Examples

❌ Incorrect

```ts
export function createUser(name: string, email: string) {}
```

✅ Correct

```ts
export function createUser(params: { name: string }) {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxParams` | `number` | `1` | Maximum object-shaped parameters. The minimum is `1`. Functions with no parameters pass. |
| `allDeclarations` | `boolean` | `false` | Also checks unexported top-level functions. Nested functions are not checked. |
| `serviceMethods` | `boolean` | `false` | Also checks methods on exported direct service objects. |
| `allowPattern` | `string \| string[]` | None | Regular expressions for function names to skip. |

```ts
// oxlint.config.ts
rules: {
  'arch/require-object-params': ['error', {
    maxParams: 2,
    serviceMethods: true,
  }],
}
```

## Preset

Preset: `serviceStructure` policy, on backend action/query files and frontend service entries; direct frontend service methods are also checked.

## Related

- [`arch/no-file-level-helpers`](./no-file-level-helpers.md)
- [`arch/no-trivial-functions`](./no-trivial-functions.md)
