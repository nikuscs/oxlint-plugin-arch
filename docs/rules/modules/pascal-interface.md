# `modules/pascal-interface`

Preset-internal syntax rule: interface names must be PascalCase.

## Why

Selector: `TSInterfaceDeclaration` whose id does not match `^[A-Z][a-zA-Z0-9]*$`. Message: `Use PascalCase for interfaces.`

## Examples

❌ Incorrect

```ts
interface value {
  id: string
}
```

✅ Correct

```ts
interface Value {
  id: string
}
```

## Options

This rule has no options.

## Preset

Preset: `typePlacement` policy, on web `components/**/*.tsx` and `hooks/**/*.ts` (UI-kit and tests excluded).

## Related

- [`modules/local-type-alias`](./local-type-alias.md)
- [`../arch/component-props`](../arch/component-props.md)
