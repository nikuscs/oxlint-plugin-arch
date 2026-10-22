# `arch/folder-prefix`

Requires a filename to start with its owning folder name or configured folder path.

## Why

The filename states which domain owns the file. This also prevents generic names such as `profile.tsx` inside a `users` folder.

## Examples

❌ Incorrect

```ts
// components/users/profile.tsx
export {}
```

✅ Correct

```ts
// components/users/user-card.tsx
export {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `singularize` | `'none' \| 'trailing-s'` | `'trailing-s'` | Optionally removes a trailing `s` from folder prefixes. |
| `separators` | `string[]` | `['-']` | Separators allowed after the folder prefix. The first item joins nested folder names. |
| `stripPrefixes` | `string[]` | `[]` | Prefixes to remove from the filename before checking it, such as `use-`. |
| `after` | `string` | None | Uses every folder after this path segment as the expected prefix. |

```ts
// oxlint.config.ts
rules: {
  'arch/folder-prefix': ['error', {
    after: 'components',
    singularize: 'trailing-s',
    separators: ['-'],
  }],
}
```

## Preset

Preset: `fileLayout` policy, on files in configured domain-layout folders and on web component files with the default layout.

## Related

- [`arch/filename-match`](./filename-match.md)
- [`arch/export-file-prefix`](./export-file-prefix.md)
