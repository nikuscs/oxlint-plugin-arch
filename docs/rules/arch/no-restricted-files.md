# `arch/no-restricted-files`

Reports every file in the consumer glob where this rule is enabled.

## Why

Oxlint overrides select the forbidden files. The rule supplies a clear project-specific diagnostic for invalid locations, extensions, or folder depths.

## Examples

❌ Incorrect

```ts
// hooks/use-thing.tsx
export function useThing() {}
```

✅ Correct

```ts
// hooks/use-thing.ts
export function useThing() {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `message` | `string` | Required | Diagnostic text reported for each matched file. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-restricted-files': ['error', {
    message: 'Hooks must use .ts files.',
  }],
}
```

## Preset

Preset: `fileLayout`, `serviceStructure`, and `typePlacement` policies, on invalid folder depths, file roles, extensions, and misplaced type files.

## Related

- [`arch/filename-match`](./filename-match.md)
- [`arch/folder-prefix`](./folder-prefix.md)
