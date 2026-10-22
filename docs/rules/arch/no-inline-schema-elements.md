# `arch/no-inline-schema-elements`

Requires configured schema combinators to use named schemas instead of inline structural schemas.

## Why

`z.array(z.object({ ... }))` hides a type that should have a name. Named elements stay reusable and match the schemas that own them.

## Examples

❌ Incorrect

```ts
const schema = z.array(z.object({ id: z.uuid() }))
const schema = z.union([namedA, z.object({ id: z.uuid() })])
```

✅ Correct

```ts
const schema = z.array(personaDashboardReference)
const schema = z.array(z.string())
const schema = z.union([namedA, namedB])
```

With `allowZodScalars: false`, `z.array(z.string())` also fails.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `namespaces` | `string[]` | `['z']` | Schema namespaces to check. |
| `methods` | `string[]` | `['array', 'union', 'record', 'tuple']` | Combinators whose elements must be named (or allowed scalars). |
| `structuralMethods` | `string[]` | `['array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'record', 'tuple', 'union']` | Calls treated as structural, so they cannot be used as inline elements. |
| `allowZodScalars` | `boolean` | `true` | Allow scalar calls such as `z.string()` as elements. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-inline-schema-elements': [
    'error',
    {
      namespaces: ['z'],
      methods: ['array', 'union', 'record', 'tuple'],
      allowZodScalars: true,
    },
  ],
}
```

## Preset

Not enabled by the preset.

## Related

- [`arch/no-local-schema-construction`](./no-local-schema-construction.md)
- [`arch/no-single-use-scalar-schema`](./no-single-use-scalar-schema.md)
