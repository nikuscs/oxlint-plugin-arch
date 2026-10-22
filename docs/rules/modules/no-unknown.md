# `modules/no-unknown`

Preset-internal syntax rule: do not write the `unknown` type. Use an owned domain type.

## Why

Selector: `TSUnknownKeyword`. Message: `Use an owned domain type rather than unknown.` App code that needs an `unknown` boundary must use an explicit rule-specific exception.

## Examples

❌ Incorrect

```ts
export type UnknownValue = unknown
```

✅ Correct

```ts
export interface UnknownInput {
  id: string
}
```

## Options

This rule has no options.

## Preset

Preset: `typeSafety` policy, on app and test files.

## Related

- [`modules/shape-suffix`](./shape-suffix.md)
- [`modules/service-types`](./service-types.md)
