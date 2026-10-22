# `modules/reasoned-directives`

Preset-internal rule: lint disables must name specific rules and explain why after `--`.

## Why

Bare `oxlint-disable` / `eslint-disable` (including `-next-line` and `-line`) without a rule list, or without a reason after `--`, fail. Example of a valid disable: `no-console -- CLI output`.

## Examples

❌ Incorrect

```ts
// oxlint-disable-next-line -- No named rule.
console.log(1)

// oxlint-disable-next-line no-console
console.log(1)
```

✅ Correct

```ts
// oxlint-disable-next-line no-console -- CLI output is intentional.
console.log(1)
```

## Options

This rule has no options.

## Preset

Preset: `comments` policy, on `**/*.{ts,tsx,mts,cts}`.

## Related

- [`../arch/no-comments`](../arch/no-comments.md)
