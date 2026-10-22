# `arch/only-export-constants`

Allows runtime exports only when they refer to local `const` bindings with allowed values.

## Why

Constant files should expose values, not mutable bindings, declarations, or hidden APIs. This is a syntax check, not a deep-immutability check.

## Examples

❌ Incorrect

```ts
export let retryCount = 0
export const retry = () => run()
```

✅ Correct

```ts
const retryLimit = 3
export { retryLimit }
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowFunctionValues` | `boolean` | `false` | Allows function-valued `const` bindings, but not function declarations. |
| `allowTypeExports` | `boolean` | `false` | Allows type aliases, interfaces, and type-only exports. |
| `allowReExports` | `boolean` | `false` | Allows `export ... from`, `export *`, and exports of imported runtime bindings. |

```ts
// oxlint.config.ts
rules: {
  'arch/only-export-constants': ['error', {
    allowTypeExports: true,
  }],
}
```

Direct, destructured, renamed, and default exports of local constants are accepted. A default value must first have a local `const` name. Objects and arrays do not need `as const` or `Object.freeze()`.

The rule rejects `let`, `var`, function, class, enum, and namespace declarations. It also rejects class-valued constants, bare default expressions, TypeScript `export =`, and `export as namespace`.

The rule follows direct local aliases and unwraps TypeScript expression wrappers. It does not evaluate calls, imports, member access, or destructured values.

## Preset

Not enabled by the preset.

## Related

- [`arch/no-extra-exports`](./no-extra-exports.md)
- [`arch/no-top-level-functions`](./no-top-level-functions.md)
- [`arch/no-module-mutable-state`](./no-module-mutable-state.md)
