# `arch/declaration-name`

Requires selected declarations to use a filename-derived prefix or match a configured pattern.

## Why

Private and exported declarations can keep the same domain vocabulary as their file. You can limit the check to specific declaration kinds.

## Examples

❌ Incorrect

```ts
// src/api/agent-setups.types.ts
type DraftStatus = {}
```

✅ Correct

```ts
// src/api/agent-setups.types.ts
type AgentSetupTimeTrigger = {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `kinds` | `('const' \| 'let' \| 'var' \| 'function' \| 'class' \| 'type' \| 'interface' \| 'enum')[]` | All kinds | Declaration kinds to check. |
| `pattern` | `string \| string[]` | None | Regular expressions that replace the filename-prefix check. Any pattern may match. |
| `flags` | `string` | None | Flags for `pattern`. |
| `stem` | `'before-first-dot' \| 'full-basename'` | `'before-first-dot'` | Part of the basename used to derive the prefix. |
| `trailingRoles` | `string[]` | `[]` | Role suffixes to remove from the stem. |
| `roleSeparators` | `string[]` | `['.', '-']` | Separators accepted before a trailing role. |
| `normalize` | `'remove-separators' \| 'none'` | `'remove-separators'` | Removes separators and compares without case, or compares the exact text. |
| `singularize` | `'none' \| 'trailing-s'` | `'none'` | Also accepts a prefix with one trailing `s` removed. |
| `allowPattern` | `string \| string[]` | None | Regular expressions for declaration names to skip. |

```ts
// oxlint.config.ts
rules: {
  'arch/declaration-name': ['error', {
    kinds: ['type', 'interface'],
    singularize: 'trailing-s',
  }],
}
```

## Preset

Preset: `typePlacement` policy, on interfaces in web component and hook files.

## Related

- [`arch/export-file-prefix`](./export-file-prefix.md)
- [`arch/export-name-pattern`](./export-name-pattern.md)
