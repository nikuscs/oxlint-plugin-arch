# ▲ next

Next.js App Router files and server/client boundaries. Opt-in.

```ts
folders: {
  'apps/web': { next: true },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `server` | `string[]` | `[]` | Extra server-only imports |
| `client` | `string[]` | `[]` | Extra client-only imports |
| `dynamic` | `string[]` | `[]` | Files allowed computed imports |

With [`basics`](basics.md) on, the default export of `app/**/{layout,page,default}.tsx` may be trivial (`defaults: false` on `arch/code-trivial-functions`); the other functions in those files are checked.

A page's default export is named after its folders, with the route markers dropped: `app/(marketing)/blog/[slug]/page.tsx` holds `MarketingBlogSlugPage`, a `layout.tsx` ends in `Layout`, and a Pages Router file `pages/blog/[slug].tsx` holds `BlogSlugPage` (`pages/api/` and `pages/_*.tsx` skipped) (`arch/naming-exports`).

Rules: [`arch/naming-exports`](../rules/naming-exports.md), [`arch/boundaries-next`](../rules/boundaries-next.md), [`arch/files-helpers`](../rules/files-helpers.md), [`arch/files-route`](../rules/files-route.md).
