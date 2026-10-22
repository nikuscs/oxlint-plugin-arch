# `arch/key-value-same-line` 🔧

Requires an object-literal property key and the start of its value to share a line.

## Why

Keeping the value start beside its key makes object structure easier to scan. The rule ignores destructuring, shorthand properties, methods, and getters or setters.

## Examples

❌ Incorrect

```ts
const row = {
  id:
    1
}
```

✅ Correct

```ts
const row = {
  id: 1
}
```

## Options

This rule has no options.

```ts
// oxlint.config.ts
rules: {
  'arch/key-value-same-line': 'error',
}
```

## Autofix

The whitespace fix replaces the gap after the key with `: `. It reports without a fix when comments occur between the key and value or when parentheses make the safe source range unclear.

## Preset

Preset: `statementLayout` policy, on all supported source files.

## Related

- [`arch/object-multiline`](./object-multiline.md)
