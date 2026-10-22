# `modules/shape-suffix`

Preset-internal syntax rule: do not name a declaration with a `Shape` suffix. Name it for its domain role.

## Why

Selector: `VariableDeclarator`, `FunctionDeclaration`, `ClassDeclaration`, `TSInterfaceDeclaration` or `TSTypeAliasDeclaration` whose id matches `/Shape$/`. Message: `Name this declaration for its domain role rather than the Shape suffix.`

## Examples

❌ Incorrect

```ts
export interface ShapeUserShape {
  id: string
}
```

✅ Correct

```ts
export interface ShapeMessage {
  id: string
}
```

## Options

This rule has no options.

## Preset

Preset: `typeSafety` policy, on app and test files.

## Related

- [`modules/no-unknown`](./no-unknown.md)
- [`modules/pascal-interface`](./pascal-interface.md)
