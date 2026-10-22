# `arch/call-array-multiline` 🔧

Splits a qualifying single-line array passed to a configured call onto one element per line.

## Why

Arrays used for batch calls are easier to review when each operation has its own line. By default, the rule checks `Promise.all` and `Promise.allSettled`.

> [!WARNING]
> Oxfmt and Prettier collapse short arrays back onto one line. Do not run this rule on files a formatter also rewrites, or they will undo each other forever.

## Examples

❌ Incorrect

```ts
Promise.all([first, second])
```

✅ Correct

```ts
Promise.all([
  first,
  second
])
```

A locally shadowed `Promise` is ignored. Other configured callee names are matched by syntax, even when their root is imported or locally declared.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `callees` | `string[]` | `['Promise.all', 'Promise.allSettled']` | Lists calls whose first array argument is checked. An empty list disables the rule. |
| `minElements` | `integer >= 1` | `2` | Sets the minimum array length that triggers the rule. |
| `indent` | `integer >= 0 \| 'tab'` | `2` | Sets indentation for each array element. |

```ts
// oxlint.config.ts
rules: {
  'arch/call-array-multiline': ['error', {
    callees: ['Promise.all'],
    minElements: 2,
    indent: 2,
  }],
}
```

## Autofix

The whitespace fix inserts line breaks around and between array elements. Sparse arrays and arrays with comments are reported without a fix.

## Preset

Preset: `statementLayout` policy, on all supported source files, for `Promise.all` arrays with at least two elements.

## Related

- [`arch/call-arguments-multiline`](./call-arguments-multiline.md)
- [`arch/chain-newline`](./chain-newline.md)
