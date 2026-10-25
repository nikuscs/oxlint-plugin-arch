# arch/backend-sql-like

Reports `LIKE`-style query calls whose value does not pass through a configured sanitizer.

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
| `operatorMethods` | `string[]` | `[]` | Methods whose second argument is the operator, like `where` |
| `allowSanitizedBindings` | `boolean` | `true` | Trust top-level variables built with a sanitizer |

```ts
'arch/backend-sql-like': ['error', { methods: ['like', 'ilike'], operatorMethods: ['where'], sanitizers: ['escapeLikeWildcards'] }]
```
