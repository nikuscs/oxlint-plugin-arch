# 🧬 schemas

Schemas live in `types/`, not inline. Opt-in.

```ts
folders: {
  'apps/web': { schemas: true },
}
```

Takes `true`, `false`, `'warn'`.

Rules: [`arch/schemas-local`](../rules/schemas-local.md), [`arch/schemas-rederive`](../rules/schemas-rederive.md).
