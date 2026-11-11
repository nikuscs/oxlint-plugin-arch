# 🗄️ sql

`LIKE` values are escaped. Opt-in.

```ts
folders: {
  'apps/server': { sql: true },
}
```

Takes `true`, `false` or `'warn'`. The rule runs with its defaults: `escapeLikeWildcards` for `like` and `ilike`, and `where` operator calls. Another sanitizer is a `rules` line:

```ts
'apps/server/src/services': { rules: { 'arch/backend-sql-like': ['error', { sanitizers: ['escapeLike'] }] } },
```

Rules: [`arch/backend-sql-like`](../rules/backend-sql-like.md).
