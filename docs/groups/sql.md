# 🗄️ sql

`LIKE` values are escaped. Opt-in.

```ts
folders: {
  'apps/server': { sql: { sanitizers: ['escapeLike'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `sanitizers` | `string[]` | `['escapeLikeWildcards']` | Escape helpers |

Rules: [`arch/backend-sql-like`](../rules/backend-sql-like.md).
