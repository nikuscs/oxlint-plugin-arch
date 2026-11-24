# 📦 imports

Import hygiene and cross-folder boundaries. On by default.

```ts
folders: {
  'apps/web': { imports: { aliases: { '@/': 'apps/web/src' } } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `sort` | `boolean` | `true` | Sorted imports |
| `boundaries` | `boolean` | `true` | Folders reach each other only through package entry points |
| `aliases` | `Record<string, string \| false>` | from `package.json` | Path aliases for this folder, e.g. `{ '@/': 'apps/web/src' }`. Every workspace's `package.json` `imports` entry with one trailing `*` is read as one: `"#server/*": "./src/*"` in `apps/server` gives `'#server': 'apps/server/src'`. A subpath two workspaces map to different folders is left out. Yours win; `false` drops a read one |
| `internal` | `string[]` | `@/`, `#`, backend entries | Import sort internal patterns |

The same aliases reach [`arch/boundaries-tanstack`](../rules/boundaries-tanstack.md) and [`arch/boundaries-next`](../rules/boundaries-next.md).

Rules: [`arch/boundaries-imports`](../rules/boundaries-imports.md), [`arch/types-namespace-import`](../rules/types-namespace-import.md).

Plus `eslint` (1), `import` (8), `import-extra` (3), `perfectionist` (2), `unused-imports` (1).
