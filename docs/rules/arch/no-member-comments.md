# `arch/no-member-comments` 🔧

Removes comments attached to interface, type-literal, and object-literal members.

## Why

Member comments often repeat the member name or type. This narrower rule leaves declaration, function-body, class-field, enum, union, parameter, destructuring, and array comments outside its scope.

## Examples

❌ Incorrect

```ts
interface Props {
  // The title.
  title: string
}
```

✅ Correct

```ts
interface Props {
  // Why: upstream rejects null.
  title: string
}
```

The rule checks properties, methods, index signatures, call signatures, construct signatures, object properties, and object spreads. It keeps directives such as `@ts-expect-error`, lint controls, formatter controls, coverage controls, and webpack magic comments.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowWhy` | `boolean` | `true` | Keeps comments that start with `Why:` and contiguous `//` continuation lines. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-member-comments': ['error', { allowWhy: false }],
}
```

## Autofix

The fix removes the comment and blank lines after it, removes spaces before a trailing comment, and keeps the member. It removes a stack of comments in one pass.

## Preset

Not enabled by the preset.

## Related

- [`arch/no-comments`](./no-comments.md)
