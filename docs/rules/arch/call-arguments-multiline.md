# `arch/call-arguments-multiline` 🔧

Puts each argument of a qualifying call or constructor on its own line.

## Why

Long argument lists are easier to scan vertically. The closing parenthesis also gets its own line.

## Examples

❌ Incorrect

```ts
save(a, b, c)
```

✅ Correct

```ts
save(
  a,
  b,
  c,
)
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `minArguments` | `integer >= 2` | `3` | Sets the minimum number of arguments that triggers the rule. |
| `indent` | `integer >= 1` | `2` | Sets the spaces added before each argument. |

```ts
// oxlint.config.ts
rules: {
  'arch/call-arguments-multiline': ['error', {
    minArguments: 3,
    indent: 2,
  }],
}
```

## Autofix

The code fix inserts line breaks and adds a trailing comma, including after a spread argument. The rule skips calls that contain comments, parenthesized arguments, or multiline arrow or function arguments. It leaves already separated argument lists unchanged.

## Preset

Not enabled by the preset.

## Related

- [`arch/object-multiline`](./object-multiline.md)
- [`arch/call-array-multiline`](./call-array-multiline.md)
- [`arch/ternary-layout`](./ternary-layout.md)
