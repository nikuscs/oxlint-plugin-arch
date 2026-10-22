# `arch/no-unescaped-like`

Requires values passed to configured `LIKE` / `ILIKE` methods to use a configured sanitizer call or sanitized binding.

## Why

Unescaped `%` and `_` in user input change `LIKE` matching. Pass the value through your sanitizer first.

## Examples

❌ Incorrect

```ts
query.ilike(column, `%${term}%`)
const pattern = term
query.like(column, pattern)
query.where('name', 'like', term)
```

✅ Correct

```ts
query.like(column, escapeLikeWildcards(term))
const escaped = escapeLikeWildcards(term)
query.ilike(column, escaped)
query.equals(column, term)
query.where('name', 'like', escapeLike(term))
query.where('name', '=', term)
```

`operatorMethods` covers calls such as `.where(column, 'like', value)`. Other operators on those methods are not checked.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `methods` | `string[]` | required | Member names such as `like` and `ilike`, and operator literals matched as the second argument of `operatorMethods`. |
| `sanitizers` | `string[]` | required | Call names that count as sanitizers. |
| `allowSanitizedBindings` | `boolean` | `true` | Allow identifiers bound to a sanitizer call in the same file. |
| `operatorMethods` | `string[]` | `[]` | Methods whose second argument is an operator string, such as `where`. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-unescaped-like': [
    'error',
    {
      methods: ['like', 'ilike'],
      operatorMethods: ['where'],
      sanitizers: ['escapeLikeWildcards'],
      allowSanitizedBindings: true,
    },
  ],
}
```

The last argument of the call is the value that must be sanitized.

## Preset

Preset: `schemas` policy, on backend `services/**/*.ts`, with `like` / `ilike`, `where`, and `options.sql.likeSanitizers` (default `escapeLikeWildcards`).

## Related

- [`arch/no-restricted-token`](./no-restricted-token.md)
