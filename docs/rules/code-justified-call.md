# arch/code-justified-call

A listed call (a call, not `new`) needs a comment on the line above that starts with `comment` followed by a space and a reason. A run of line comments counts when any of them starts with it; a blank line breaks the link.

```ts
// ❌
Effect.promise(() => cache.get(key))

// ✅
// SAFETY: cache.get catches every error and resolves undefined
Effect.promise(() => cache.get(key))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `calls` | `string[]` | required | Dotted call names, such as `Effect.promise`; at least one |
| `comment` | `string` | `'SAFETY:'` | Prefix the comment starts with, followed by a space and a reason |
| `message` | `string` | | Text appended to the report |

```ts
'arch/code-justified-call': ['error', { calls: ['Effect.promise'] }]
```
