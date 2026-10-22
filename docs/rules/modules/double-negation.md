# `modules/double-negation`

Preset-internal syntax rule: do not coerce with `!!`. Use `Boolean(value)` or an explicit comparison.

## Why

Selector: `UnaryExpression[operator="!"] > UnaryExpression[operator="!"]`. Message: `Use Boolean(value) or an explicit comparison.`

## Examples

❌ Incorrect

```ts
export const present = !!value
```

✅ Correct

```ts
export const visible = Boolean(value)
```

## Options

This rule has no options.

## Preset

Preset: `backend` policy, on app and test files (UI-kit files excluded).

## Related

- [`modules/no-unknown`](./no-unknown.md)
