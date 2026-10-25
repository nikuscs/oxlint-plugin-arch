# arch/backend-sql-like

Reports `LIKE`-style query calls whose value is not a sanitizer call, or a template, `+`, ternary or `??`/`||` whose dynamic parts are all sanitized.

```ts
// ❌
export const search = (term: string) => db.selectFrom('chats').where('title', 'ilike', `%${term}%`)

// ✅
export const search = (term: string) => db.selectFrom('chats').where('title', 'ilike', `%${escapeLikeWildcards(term)}%`)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `methods` | `string[]` | required | Method names, or operator strings, to check |
| `sanitizers` | `string[]` | required | Functions that escape wildcards |
| `operators` | `string[]` | `[]` | Methods whose second argument is the operator, like `where` |
| `bindings` | `boolean` | `true` | Trust top-level variables that are never reassigned and hold a sanitized value |

```ts
'arch/backend-sql-like': ['error', { methods: ['like', 'ilike'], operators: ['where'], sanitizers: ['escapeLikeWildcards'] }]
```
