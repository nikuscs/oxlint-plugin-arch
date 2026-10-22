# `arch/export-file-prefix`

Requires exported names, and optionally other declarations, to start with a prefix derived from the filename.

## Why

Names stay tied to the domain and role of their file. Optional checks also cover private functions, every declaration, and public methods on direct service objects.

## Examples

❌ Incorrect

```ts
// services/blog.client.ts
export const getBlog = () => null
```

✅ Correct

```ts
// services/blog-post.client.ts
export const blogPostGet = () => null
export type BlogPost = {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | Part of the basename used to derive the prefix. |
| `trailingRoles` | `string[]` | `[]` | Role suffixes to remove from the stem. |
| `roleSeparators` | `string[]` | `['.', '-']` | Separators accepted before a trailing role. |
| `normalize` | `'remove-separators' \| 'none'` | `'remove-separators'` | Removes separators and compares without case, or compares exact text. |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Also accepts a prefix with one trailing `s` removed. |
| `serviceMethods` | `boolean` | `false` | Also checks the binding and methods of exported direct service objects. Returned factory keys are not checked. |
| `allFunctions` | `boolean` | `false` | Also checks private named function declarations and function-valued variables at any depth. |
| `allDeclarations` | `boolean` | `false` | Checks every named declaration instead of only exports. This includes nested declarations. |
| `allowPattern` | `string \| string[]` | None | Regular expressions for names to skip. |

```ts
// oxlint.config.ts
rules: {
  'arch/export-file-prefix': ['error', {
    trailingRoles: ['utils'],
    allFunctions: true,
  }],
}
```

## Preset

Preset: `naming` policy, on hooks and app files with constants, utilities, handlers, services, types, or runtime roles; `serviceStructure` also checks custom file roles.

## Related

- [`arch/declaration-name`](./declaration-name.md)
- [`arch/filename-export-name`](./filename-export-name.md)
- [`arch/export-name-pattern`](./export-name-pattern.md)
