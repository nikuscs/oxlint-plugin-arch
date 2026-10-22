# `arch/require-orpc-output`

Checks oRPC procedure chains for a named `.output()` schema before `.handler()`.

## Why

A public procedure without an output schema has no declared response contract. Inline `z.object({})` is not a named schema.

## Examples

❌ Incorrect

```ts
procedure.input(inputSchema).handler(() => ({}))
procedure.output(z.object({})).handler(() => ({}))
procedure.output(paginatedOutput(z.object({}))).handler(() => ({}))
```

✅ Correct

```ts
procedure.output(brandApiDetail).handler(() => ({}))
procedure.output(paginatedOutput(brandApiSummary)).handler(() => ({}))
```

A composer from `composers` is valid only when its argument is a named schema.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `composers` | `string[]` | required | Function names that wrap a named output schema, such as `paginatedOutput`. |
| `handlerMethod` | `string` | `'handler'` | Chain method that ends the procedure. |
| `outputMethod` | `string` | `'output'` | Chain method that must appear before the handler. |

```ts
// oxlint.config.ts
rules: {
  'arch/require-orpc-output': [
    'error',
    {
      composers: ['paginatedOutput'],
      handlerMethod: 'handler',
      outputMethod: 'output',
    },
  ],
}
```

## Preset

Preset: `schemas` policy, on `options.orpc.publicProcedureFiles` when that list is set.

## Related

- [`arch/no-local-schema-construction`](./no-local-schema-construction.md)
- [`arch/no-inline-schema-elements`](./no-inline-schema-elements.md)
