# `arch/no-comments` 🔧

Reports comments except directives and explicitly allowed notes or patterns.

## Why

This rule keeps matched files free of explanatory or leftover comments while preserving comments required by tools. It always keeps shebangs, compiler and lint directives, bundler annotations, source map comments, and legal comments.

## Examples

❌ Incorrect

```ts
// leftover thought
const value = 1
```

✅ Correct

```ts
// Why: cache keys must stay stable.
const value = 1
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowWhy` | `boolean` | `true` | Keeps comments that start with `Why:` and contiguous `//` continuation lines. |
| `allowPatterns` | `string[]` | `[]` | Keeps comments whose trimmed text matches any regular expression. |
| `allowJsdoc` | `boolean` | `false` | Keeps JSDoc comments. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-comments': ['error', {
    allowWhy: false,
    allowPatterns: ['^SAFETY: '],
    allowJsdoc: true,
  }],
}
```

## Autofix

The fix removes comments and surrounding blank lines or horizontal space while preserving token separation. JSX comments and comments next to a `disable-next-line` target are reported without a fix. Stacked comments are removed in one pass.

## Preset

Preset: `comments` policy, on application files except UI, and on application `*.types.ts` and `*.constants.ts` files. It disables `Why:` notes and allows `SAFETY:` notes in general application files.

## Related

- [`arch/no-member-comments`](./no-member-comments.md)
