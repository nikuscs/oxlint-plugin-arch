# `arch/no-extra-exports`

Allows only configured export names and filename-derived export-name patterns.

## Why

A file can expose a small, predictable API. Exact templates cover known exports, while patterns cover a controlled family of names.

## Examples

❌ Incorrect

```ts
// services/billing/billing.service.ts
export const helper = 1
```

✅ Correct

```ts
// services/api-key/api-key.service.ts
export function makeApiKeyService() {}
export type ApiKeyService = {}
export const apiKeyServiceDefinition = {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `names` | `string[]` | Required | Exact allowed names. `{Domain}` and `{domain}` use the filename stem. Use `default` for a default export. |
| `patterns` | `string[]` | `[]` | Full-match regular expression templates. They also support `{Domain}` and `{domain}`. |
| `domainStem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | Part of the basename used as the domain. |
| `trailingRoles` | `string[]` | `[]` | Role suffixes to remove from the domain stem. |
| `roleSeparators` | `string[]` | `['.', '-']` | Separators accepted before a trailing role. |
| `allowTypeExports` | `boolean` | `false` | Allows all type-only exports without checking their names. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-extra-exports': ['error', {
    names: ['make{Domain}Service', '{Domain}Service'],
    patterns: ['{Domain}[A-Z]\\w*'],
  }],
}
```

## Preset

Preset: `serviceStructure` policy, on backend `services/**/*.service.ts` files.

## Related

- [`arch/export-file-prefix`](./export-file-prefix.md)
- [`arch/only-export-constants`](./only-export-constants.md)
- [`arch/no-extra-factory-keys`](./no-extra-factory-keys.md)
