# `arch/padding-between-statements` 🔧

Requires blank lines between selected statement kinds and around multiline variable declarations when configured.

## Why

Blank lines separate declarations and control flow into readable groups. The rule handles top-level statements and statements inside blocks.

## Examples

❌ Incorrect

```ts
const n = 1
if (n) {}
```

✅ Correct

```ts
const n = 1

if (n) {}
```

The rule also separates functions and classes from adjacent statements, consecutive control-flow statements, and returns in sufficiently large blocks.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `returnMinStatements` | `integer >= 1` | `3` | Requires a blank line before `return` when its block has at least this many statements and the previous statement is not a variable declaration. |
| `multilineVariables` | `boolean` | `false` | Requires blank lines around multiline variable declarations, including exported declarations. |

```ts
// oxlint.config.ts
rules: {
  'arch/padding-between-statements': ['error', {
    returnMinStatements: 3,
    multilineVariables: true,
  }],
}
```

## Autofix

The fix inserts one blank line and preserves the file newline style. It reports without a fix when insertion could split a spanning block comment or disconnect a `disable-next-line` directive from its target.

## Preset

Preset: `statementLayout` policy, on all supported source files. It enables `multilineVariables: true`.

## Related

- [`arch/object-multiline`](./object-multiline.md)
- [`arch/ternary-layout`](./ternary-layout.md)
