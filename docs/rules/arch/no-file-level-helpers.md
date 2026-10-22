# `arch/no-file-level-helpers`

Rejects file-level functions unless they are recognized components, hooks, or explicitly allowed names.

## Why

A private helper that serves one component, hook, or route handler belongs inside its owner. Shared domain logic belongs in a deliberate module with its own public contract.

## Examples

❌ Incorrect

```tsx
function handlePersonaSearch() {}
export function ContentForm() { return <form /> }
```

✅ Correct

```tsx
export function ContentForm() {
  function handleSubmit() {}
  return <form />
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowPattern` | `string \| string[]` | None | Regular expressions for function names to allow. An allowed exported alias also allows its local binding. |
| `detectComponents` | `boolean` | `true` | Allows functions recognized as React components. |
| `hookPattern` | `string \| string[]` | `'^use[A-Z]'` | Regular expressions for names treated as hooks. |
| `message` | `string` | `'Keep this helper inside its owning component or hook.'` | Guidance appended to the function name in the diagnostic. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-file-level-helpers': ['error', {
    detectComponents: false,
    message: 'Nest this helper in its route handler callback.',
  }],
}
```

## Preset

Preset: `react` policy on web components, and `routes` policy on TanStack handler files and Next route handlers.

## Related

- [`arch/no-top-level-functions`](./no-top-level-functions.md)
- [`arch/require-object-params`](./require-object-params.md)
- [`arch/no-trivial-functions`](./no-trivial-functions.md)
