# arch/code-justified-call

A listed call needs a comment on the line above that starts with `comment` and says why it is safe. A run of line comments counts when any of them starts with it.

```ts
// ❌
Effect.promise(() => cache.get(key))

// ✅
// SAFETY: cache.get catches every error and resolves undefined
Effect.promise(() => cache.get(key))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `calls` | `string[]` | | Dotted call names, such as `Effect.promise` |
| `comment` | `string` | `'SAFETY:'` | Prefix the comment starts with |
| `message` | `string` | | Text added to the report |

```ts
'arch/code-justified-call': ['error', { calls: ['Effect.promise'] }]
```
