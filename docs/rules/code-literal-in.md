# arch/code-literal-in

An `in` check whose left side is a string literal or a template without expressions.

```ts
// ❌
if ('email' in user) send(user)

// ✅
if (Object.hasOwn(user, 'email')) send(user)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allow` | `string[]` | `[]` | Keys that may appear before `in` (exact match) |

```ts
'arch/code-literal-in': ['error', { allow: ['window'] }]
```
