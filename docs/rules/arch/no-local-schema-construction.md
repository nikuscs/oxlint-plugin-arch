# `arch/no-local-schema-construction`

Rejects runtime schema-library imports and local schema construction. Imported named schemas are allowed.

## Why

Schemas belong in the files that own them. Callers import a named schema instead of building `z.object(...)` at the use site.

## Examples

❌ Incorrect

```ts
import { z } from 'zod'
const schema = z.object({ name: z.string() })
```

```ts
standardSchemaResolver(z.object({ id: z.string() }))
```

✅ Correct

```ts
import { userSchema } from '@app/server'
standardSchemaResolver(userSchema)
```

```ts
import type { z } from 'zod'
type User = z.infer<typeof userSchema>
```

Type-only imports and type-only re-exports of the schema library pass. Owner files can be exempted with `allowIn` or `allowPathPatterns`.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `packages` | `string[]` | `['zod']` | Schema packages whose runtime imports and re-exports are banned. |
| `namespaces` | `string[]` | `['z']` | Constructor namespaces treated as schema builders (`z.object`). |
| `allowIn` | `string[]` | `[]` | Filename suffixes where the rule is off. |
| `allowPathPatterns` | `string[]` | `[]` | Regular expressions for paths where the rule is off. |
| `message` | `string` | none | Fallback text for both reports. Placeholders: `{{source}}` on imports. |
| `runtimeImportMessage` | `string` | `Do not import runtime schema constructors from {{source}}; import a named schema instead.` | Import and re-export report text. |
| `constructionMessage` | `string` | `Do not construct schemas locally; import a named schema instead.` | Construction report text. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-local-schema-construction': [
    'error',
    {
      packages: ['zod'],
      namespaces: ['z'],
      allowIn: ['/src/forms/legacy-form.tsx'],
      allowPathPatterns: ['/src/components/'],
    },
  ],
}
```

Named constructor imports such as `import { object } from 'zod'` are also treated as runtime constructors.

## Preset

Preset: `schemas` policy, on app files except schema-owner `types/**` (backend, or Next web when there is no backend), colocated type files, and UI.

## Related

- [`arch/no-inline-schema-elements`](./no-inline-schema-elements.md)
- [`arch/no-rederive-schema`](./no-rederive-schema.md)
- [`arch/require-orpc-output`](./require-orpc-output.md)
