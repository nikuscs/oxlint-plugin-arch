# `arch/no-extra-factory-keys`

Restricts keys in object literals returned directly by selected top-level factories.

## Why

A factory can expose a small, explicit API. Required keys also detect missing or empty factory results.

## Examples

❌ Incorrect

```ts
export function makeAction() {
  return { run() {}, preview() {} }
}
```

✅ Correct

```ts
export function makeAction() {
  async function run() {}
  return { run }
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `keys` | `string[]` | None | Keys allowed by the fallback rule. At least `keys` or `keySets` must be set for the rule to check anything. |
| `factoryPattern` | `string \| string[]` | `'^make[A-Z]'` | Regular expressions that select factories for `keys`. |
| `requireKeys` | `string[]` | `[]` | Keys that selected fallback factories must return. Required keys are also allowed. |
| `keySets` | `{ factoryPattern: string \| string[]; keys: string[]; requireKeys?: string[] }[]` | `[]` | Per-factory key policies. The first matching set wins and takes priority over the fallback rule. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-extra-factory-keys': ['error', {
    keySets: [
      { factoryPattern: '^makeAction', keys: ['run'], requireKeys: ['run'] },
      { factoryPattern: '^makeQuery', keys: ['get', 'list'] },
    ],
  }],
}
```

Only direct object returns are checked. Computed keys and spreads are reported as extra keys because their names cannot be proved safe.

## Preset

Not enabled by the preset.

## Related

- [`arch/require-file-factory`](./require-file-factory.md)
- [`arch/no-extra-exports`](./no-extra-exports.md)
