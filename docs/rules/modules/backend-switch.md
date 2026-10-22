# `modules/backend-switch`

Preset-internal syntax rule: do not use `switch` in backend application code. Use ts-pattern instead.

## Why

Selector: `SwitchStatement`. Message: `Use ts-pattern in backend application code.` Exhaustive matching belongs in `match`, not `switch`. CLI files can be excluded by the preset.

## Examples

❌ Incorrect

```ts
export function choose(value: string) {
  switch (value) {
    case 'a':
      return 1
    default:
      return 0
  }
}
```

✅ Correct

```ts
export const label = match(status).with('ready', () => 'Ready').otherwise(() => 'Pending')
```

## Options

This rule has no options.

## Preset

Preset: `backend` policy, on backend source files (`cliFiles` excluded).

## Related

- [`modules/double-negation`](./double-negation.md)
