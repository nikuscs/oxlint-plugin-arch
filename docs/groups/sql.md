# 🗄️ sql

`LIKE` values are escaped and Kysely chains put each call on its own line. Opt-in.

```ts
folders: {
  'apps/server': { sql: true },
}
```

Takes `true`, `false` or `'warn'`. The rule runs with its defaults: `escapeLikeWildcards` for `like` and `ilike`, and `where` operator calls. Another sanitizer is a `rules` line:

```ts
'apps/server/src/services': { rules: { 'arch/backend-sql-like': ['error', { sanitizers: ['escapeLike'] }] } },
```

Kysely chains: [`arch/layout-chain`](../rules/layout-chain.md) with `groups: [{ min: 3, methods: ['selectFrom', 'insertInto', 'updateTable', 'deleteFrom', 'mergeInto', 'with'] }]`. Other builders are a `rules` line with your own `groups`.

Rules: [`arch/backend-sql-like`](../rules/backend-sql-like.md), [`arch/layout-chain`](../rules/layout-chain.md).
