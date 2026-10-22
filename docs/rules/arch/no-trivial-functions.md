# `arch/no-trivial-functions`

Rejects empty, constant, identity, and pass-through functions that add no transformation.

## Why

Thin wrappers and generic guard helpers add names without adding a useful boundary. Precise mode preserves transformations, queries, reordered arguments, and other meaningful work.

## Examples

❌ Incorrect

```ts
export function loadUser(id: string) {
  return fetchUser(id)
}
```

✅ Correct

```ts
export function createUser(params: { name: string }) {
  if (!params.name) throw new Error('missing')
  return saveUser(params)
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowPattern` | `string \| string[]` | None | Regular expressions for function names to skip. |
| `allowCallees` | `string[]` | `[]` | Regular expressions for direct callee paths whose wrappers are allowed. Computed callees do not match. |
| `allowAsync` | `boolean` | `false` | Allows async wrappers around calls. Empty and constant async functions still fail. |
| `mode` | `'legacy' \| 'precise'` | `'legacy'` | Precise mode rejects unchanged-argument forwarding and enables generic-helper checks. |
| `checkServiceMethods` | `boolean` | `false` | Also checks methods on exported direct service objects. Returned factory methods are not checked. |
| `bannedNames` | `string[]` | Precise-mode list | Replaces the exact forbidden helper names. Use `[]` to disable name checks. |
| `checkGenericGuards` | `boolean` | `true` in precise mode | Rejects structurally generic runtime guards and fallback readers, including renamed ones and nested functions. |

The precise-mode default banned names are `isRecord`, `isPlainObject`, `isObject`, `isString`, `isNumber`, `isBoolean`, `isArray`, `asRecord`, and `asArray`.

```ts
// oxlint.config.ts
rules: {
  'arch/no-trivial-functions': ['error', {
    mode: 'precise',
    allowCallees: ['^http\\.get$'],
  }],
}
```

This rule does not count usages, inspect other files, or rewrite code. Use an explicit rule exclusion for a deliberate adapter.

## Preset

Preset: `trivialFunctions` policy, on app files except UI-kit files; frontend service entries also check direct service methods.

## Related

- [`arch/no-file-level-helpers`](./no-file-level-helpers.md)
- [`arch/require-object-params`](./require-object-params.md)
