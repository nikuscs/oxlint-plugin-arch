# `arch/ternary-layout` 🔧

Joins short conditional expressions and splits long ones before `?` and `:`.

## Why

A single length rule keeps conditional expressions compact when they fit and structured when they do not. The full resulting line, including text before and after the expression, determines its length.

## Examples

❌ Incorrect

```ts
const result = ready ? yes : no
```

✅ Correct

```ts
const result = ready
  ? yes
  : no
```

The example is correct with `maxLength: 20`. Direct template interpolations stay on one line regardless of length. The rule skips conditionals with a conditional parent or operand, comments, or multiline operands. Existing long multiline conditionals stay unchanged.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxLength` | `integer >= 1` | `160` | Sets the maximum full-line length for a joined conditional. |
| `indent` | `integer >= 1` | `2` | Sets the spaces added before `?` and `:` when splitting. |

```ts
// oxlint.config.ts
rules: {
  'arch/ternary-layout': ['error', { maxLength: 120, indent: 2 }],
}
```

## Autofix

The whitespace fix joins a short multiline conditional or inserts line breaks before `?` and `:` in a long single-line conditional.

## Preset

Not enabled by the preset.

## Related

- [`arch/call-arguments-multiline`](./call-arguments-multiline.md)
- [`arch/padding-between-statements`](./padding-between-statements.md)
