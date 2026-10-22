# `arch/jsx-attributes-multiline` 🔧

Splits a qualifying single-line JSX opening tag onto one attribute per line with a separate closing token.

## Why

Large JSX tags are easier to scan when each attribute has its own line. The rule handles normal attributes and spread attributes.

> [!WARNING]
> Oxfmt and Prettier collapse short JSX tags back onto one line. Do not run this rule on files a formatter also rewrites, or they will undo each other forever.

## Examples

❌ Incorrect

```tsx
const view = <Panel first={1} second={2} third={3} />
```

✅ Correct

```tsx
const view = <Panel
  first={1}
  second={2}
  third={3}
/>
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `minAttributes` | `integer >= 1` | `3` | Sets the minimum number of attributes that triggers the rule. |
| `indent` | `integer >= 0 \| 'tab'` | `2` | Sets indentation for each attribute. |

```ts
// oxlint.config.ts
rules: {
  'arch/jsx-attributes-multiline': ['error', {
    minAttributes: 3,
    indent: 2,
  }],
}
```

## Autofix

The whitespace fix puts each attribute and the closing `>` or `/>` on separate lines. A tag with comments inside is reported without a fix.

## Preset

Preset: `react` policy, on web source files except UI files, with at least three attributes.

## Related

- [`arch/component-props`](./component-props.md)
- [`arch/object-multiline`](./object-multiline.md)
