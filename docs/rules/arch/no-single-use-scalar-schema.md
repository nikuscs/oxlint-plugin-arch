# `arch/no-single-use-scalar-schema`

Reports a local scalar schema binding used exactly once where that scalar can be written inline.

## Why

A one-off `const userId = z.number()` that is then used only as `z.object({ id: userId })` adds a name without reuse. Exported, reused, or inferred bindings stay.

## Examples

❌ Incorrect

```ts
const userId = z.number()
const user = z.object({ id: userId })
```

```ts
const item = z.string()
const items = z.array(item)
```

✅ Correct

```ts
const user = z.object({ id: z.number() })
```

```ts
const userId = z.number()
const user = z.object({ id: userId, parentId: userId })
```

```ts
export const userId = z.number()
const user = z.object({ id: userId })
```

```ts
const userId = z.number()
type UserId = z.infer<typeof userId>
```

`let` bindings, structural schemas (`z.object`, `.or`, `.pipe`), and uses that are not a direct object field or configured combinator element are not reported. The rule does not autofix: moving construction can cross comments or other statements.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `namespaces` | `string[]` | `['z']` | Schema namespaces to check. |
| `methods` | `string[]` | `['array', 'union', 'record', 'tuple']` | Combinators where a single-use scalar element should be inlined. |
| `structuralMethods` | `string[]` | `['and', 'array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'or', 'pipe', 'record', 'transform', 'tuple', 'union']` | Methods that make a binding structural (not a scalar). |
| `allowZodScalars` | `boolean` | `true` | When `false`, combinator elements are not treated as inlineable scalars. Direct `z.object` fields are still checked. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-single-use-scalar-schema': [
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

- [`arch/no-inline-schema-elements`](./no-inline-schema-elements.md)
- [`arch/no-local-schema-construction`](./no-local-schema-construction.md)
