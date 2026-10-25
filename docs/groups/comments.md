# 💬 comments

No comments, except directives and `SAFETY:` notes. On by default.

```ts
folders: {
  'apps/web': { comments: { directives: false } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `directives` | `boolean` | `true` | Disable directives need a reason |

Rules: [`arch/comments-code`](../rules/comments-code.md), [`arch/comments-directives`](../rules/comments-directives.md).
