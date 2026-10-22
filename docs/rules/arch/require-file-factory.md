# `arch/require-file-factory`

Requires the factory function promised by the current filename.

## Why

A factory file should expose the one function that its name describes. The expected function name comes from a configurable template.

## Examples

❌ Incorrect

```ts
// services/workflow/workflow-validation.ts
const wrongFactory = () => ({})
export { wrongFactory }
```

✅ Correct

```ts
// services/workflow/workflow-validation.ts
export function makeWorkflowValidation() {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `factory` | `string` | Required | Expected name template. `{Stem}` is the PascalCase basename and `{stem}` is the unchanged basename. |
| `allDeclarations` | `boolean` | `false` | Checks all declared functions instead of only exported functions. |

```ts
// oxlint.config.ts
rules: {
  'arch/require-file-factory': ['error', {
    factory: 'make{Stem}',
  }],
}
```

## Preset

Not enabled by the preset.

## Related

- [`arch/filename-export-name`](./filename-export-name.md)
- [`arch/no-extra-factory-keys`](./no-extra-factory-keys.md)
