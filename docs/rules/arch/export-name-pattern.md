# `arch/export-name-pattern`

Requires exported names, or every declaration, to match at least one configured regular expression.

## Why

Use this rule when a file role needs a naming contract that cannot be derived only from the filename.

## Examples

❌ Incorrect

```ts
export async function getPost() {}
```

✅ Correct

```ts
export async function blogRscGetPost() {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `pattern` | `string \| string[]` | Required | Regular expressions for checked names. Any pattern may match. |
| `flags` | `string` | None | Flags for `pattern`. |
| `ignoreTypeExports` | `boolean` | `false` | Skips type-only exports. |
| `allDeclarations` | `boolean` | `false` | Checks every named declaration instead of only exports. |
| `allowPattern` | `string \| string[]` | None | Regular expressions for names to skip. |

```ts
// oxlint.config.ts
rules: {
  'arch/export-name-pattern': ['error', {
    pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$',
  }],
}
```

## Preset

Preset: `naming` policy, on hooks and web RSC service entries that are not action or query files.

## Related

- [`arch/export-file-prefix`](./export-file-prefix.md)
- [`arch/filename-export-name`](./filename-export-name.md)
