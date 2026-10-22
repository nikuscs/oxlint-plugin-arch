# `arch/filename-export-name`

Builds an expected function name from filename placeholders and checks exported or declared functions against it.

## Why

A filename can define the exact public operation name. This is useful for action, query, hook, and similar role-based files.

## Examples

❌ Incorrect

```ts
// actions/persona-action.generate.ts
export function makeWrongFactory() {}
```

✅ Correct

```ts
// actions/persona-action.generate.ts
export function makePersonaActionGenerate() {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `file` | `string` | Required | Filename template with placeholders such as `{domain}` and `{name}`. |
| `export` | `string` | Required | Expected function-name template. Capitalized placeholders produce PascalCase text. |
| `mode` | `'all' \| 'some'` | `'all'` | Requires every checked function to have the name, or requires at least one matching function. |
| `placeholderPattern` | `string` | `'[a-z0-9-]+'` | Regular expression used to capture each filename placeholder. |
| `camelCase` | `boolean` | `false` | Converts lowercase placeholder values such as `user-profile` to `userProfile`. The default preserves captured text. |
| `allDeclarations` | `boolean` | `false` | Checks all function declarations instead of only exported functions. |

```ts
// oxlint.config.ts
rules: {
  'arch/filename-export-name': ['error', {
    file: '{domain}-action.{name}.ts',
    export: '{domain}Action{Name}',
    placeholderPattern: '[a-z0-9-]+',
    camelCase: true,
  }],
}
```

## Preset

Preset: `naming` policy, on backend and frontend action/query files in configured app roots.

## Related

- [`arch/filename-match`](./filename-match.md)
- [`arch/export-file-prefix`](./export-file-prefix.md)
- [`arch/require-file-factory`](./require-file-factory.md)
