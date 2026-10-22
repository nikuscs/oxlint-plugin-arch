# `arch/no-module-mutable-state`

Rejects module-scope `let` and `var` bindings.

## Why

Module state is shared across requests and tests. Keep mutable values inside the function, request, or object that owns their lifetime.

## Examples

❌ Incorrect

```ts
let count = 0
```

✅ Correct

```ts
function run() {
  let count = 0
  return count
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `kinds` | `('let' \| 'var')[]` | `['let', 'var']` | Declaration kinds to reject. |
| `allowNamePattern` | `string \| string[]` | None | Regular expressions for binding names to allow. Each destructured binding is checked separately. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-module-mutable-state': ['error', {
    kinds: ['let', 'var'],
    allowNamePattern: '^cache$',
  }],
}
```

Function-local declarations, block-local `let`, declarations in static blocks, and ambient declarations are ignored. Function-scoped `var` in a top-level block or loop is still module state and is reported.

## Preset

Preset: `mutableState` policy, on safety-checked files except UI-kit files.

## Related

- [`arch/only-export-constants`](./only-export-constants.md)
- [`arch/no-top-level-functions`](./no-top-level-functions.md)
