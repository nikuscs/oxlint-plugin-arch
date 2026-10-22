# `arch/no-inline-types`

Requires named types instead of inline object or function types in function signatures.

## Why

Named types stay reusable. Inline `{ ... }` on parameters, returns, callbacks, and methods hide that contract. The rule checks explicit annotations only. Inferred types, variable annotations, and generic constraints are left alone.

## Examples

❌ Incorrect

```ts
function save(input: { id: string }): { ok: boolean } {
  return persist(input)
}

items.map((item: { id: string }) => item.id)
```

✅ Correct

```ts
function save(input: SaveInput): SaveResult {
  return persist(input)
}

const save = (input: SaveInput): Promise<SaveResult> => run(input)
```

Named type and interface definitions are not checked, even when they contain inline objects. Nested annotations count: `Promise<{ ok: boolean }>` fails. An outer type is reported once, not again for each member inside it.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `parameters` | `boolean` | `true` | Check parameter annotations, including destructuring, defaults, rest, and constructor parameter properties. |
| `returns` | `boolean` | `true` | Check explicit return annotations. |
| `functionTypes` | `boolean` | `true` | Also reject inline function and constructor types. |
| `minMembers` | `integer` (`>= 1`) | `1` | Allow inline object types with fewer members than this. `1` also rejects `{}`. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-inline-types': [
    'error',
    {
      parameters: true,
      returns: true,
      functionTypes: true,
      minMembers: 1,
    },
  ],
}
```

Use `no-type-declarations` separately to control where named types may live. With `functionTypes: false`, object types nested inside function types are still checked. If both `parameters` and `returns` are `false`, the rule does nothing.

## Preset

Preset: `serviceStructure` policy, on app `services/**` except utilities, tests, concept files, and migrations.

## Related

- [`arch/no-type-declarations`](./no-type-declarations.md)
- [`arch/component-props`](./component-props.md)
