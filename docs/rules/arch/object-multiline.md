# `arch/object-multiline` 🔧

Splits qualifying single-line object literals onto one property per line with a trailing comma.

## Why

Large object arguments are easier to review when each property has its own line. By default, the rule changes only objects passed directly to calls or constructors.

## Examples

❌ Incorrect

```ts
save({ id, name, email })
```

✅ Correct

```ts
save({
  id,
  name,
  email,
})
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `minProperties` | `integer >= 1` | `3` | Sets the minimum number of properties that triggers the rule. |
| `scope` | `'call-args' \| 'all'` | `'call-args'` | Checks only direct call and constructor arguments, or every object literal. |
| `indent` | `integer >= 0 \| 'tab'` | `2` | Sets the indentation added before each property. |

```ts
// oxlint.config.ts
rules: {
  'arch/object-multiline': ['error', {
    minProperties: 3,
    scope: 'call-args',
    indent: 2,
  }],
}
```

## Autofix

The fix changes line breaks and indentation and adds a trailing comma. It reports without a fix when the object contains comments or its property gaps contain other syntax.

## Preset

Preset: `statementLayout` policy, on all supported source files, with three properties and `scope: 'call-args'`.

## Related

- [`arch/call-arguments-multiline`](./call-arguments-multiline.md)
- [`arch/key-value-same-line`](./key-value-same-line.md)
- [`arch/padding-between-statements`](./padding-between-statements.md)
