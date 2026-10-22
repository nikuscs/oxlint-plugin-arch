# `arch/no-rederive-schema`

Prevents deriving types from configured imported schemas when the package should export a named type.

## Why

If a package already owns a DTO type, callers should import that type. `z.infer<typeof importedSchema>` re-creates it at every use site.

## Examples

❌ Incorrect

```ts
import { brandApiDetail } from '@app/server/client'
type Brand = z.infer<typeof brandApiDetail>
```

```ts
import { brandApiDetail as detailSchema } from '@app/server/client'
type Brand = z.input<typeof detailSchema>
```

✅ Correct

```ts
import type { BrandDto } from '@app/server/client'
type Brand = BrandDto
```

```ts
const localSchema = z.object({})
type Local = z.infer<typeof localSchema>
```

Deriving from a schema imported from a module that is not in `from` passes.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `from` | `string[]` | required | Import sources whose schemas must not be re-derived. |
| `namespaces` | `string[]` | `['z']` | Type namespaces for operators (`z.infer`). |
| `operators` | `string[]` | `['infer', 'input']` | Type operators to reject on imported schemas. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-rederive-schema': [
    'error',
    {
      from: ['@app/server/client'],
      namespaces: ['z'],
      operators: ['infer', 'input'],
    },
  ],
}
```

## Preset

Preset: `schemas` policy, on web files, with `from` set to public backend entrypoints and operators `infer` / `input`.

## Related

- [`arch/no-local-schema-construction`](./no-local-schema-construction.md)
- [`arch/no-imported-type-alias`](./no-imported-type-alias.md)
