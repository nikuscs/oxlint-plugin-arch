# arch/backend-sql-like

Reports `like`/`ilike` calls (or `where(column, 'ilike', value)`) whose last argument is not a sanitizer call, or a template, `+`, ternary, `??` or `||` of constants and sanitized parts.

```ts
// ❌
export const search = (term: string) => db.selectFrom('chats').where('title', 'ilike', `%${term}%`)

// ✅
export const search = (term: string) => db.selectFrom('chats').where('title', 'ilike', `%${escapeLikeWildcards(term)}%`)

// ✅ bindings
const pattern = escapeLikeWildcards(term)
export const search = () => db.selectFrom('chats').where('title', 'ilike', pattern)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `methods` | `string[]` | `['like', 'ilike']` | Method names, or operator strings, to check. Replaces the default |
| `sanitizers` | `string[]` | `['escapeLikeWildcards']` | Functions that escape wildcards, matched by plain name only (`utils.escapeLikeWildcards(x)` reports). A zero-argument method on a sanitized value passes (`.toLowerCase()`); `as`, `satisfies` and `!` are unwrapped. Replaces the default |
| `operators` | `string[]` | `['where']` | Methods whose second argument is the operator. Replaces the default |
| `bindings` | `boolean` | `true` | Trust top-level variables that are never reassigned and hold a sanitized value |

A value with no dynamic part is reported (`'%foo%'`): a template, `+`, ternary, `??` or `||` needs at least one sanitized dynamic part and no unsanitized one; string literals in it are skipped.

```ts
'arch/backend-sql-like': ['error', { sanitizers: ['escapeLike'] }]
```
