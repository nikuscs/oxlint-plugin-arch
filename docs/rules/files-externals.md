# arch/files-externals

Checks bundler externals against `package.json`, in `vite.config.*` (`ssr.external`) and `next.config.*` (`serverExternalPackages`). Every listed external must be a dependency. When the list exists and holds only string literals, every dependency matching `packages` must be in it; a config without a list, or a list with spreads or variables, skips that check. Node builtins (`node:*`, `bun:*`) are skipped; files whose name misses `files` are skipped before any visitor runs.

```ts
// package.json: { "dependencies": { "pg": "^8" } }

// ❌ vite.config.ts
export default defineConfig({ ssr: { external: ['stripe'] } })

// ✅
export default defineConfig({ ssr: { external: ['pg'] } })
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `packages` | `string[]` | `[]` | Dependencies that must stay external; `*` matches one segment |
| `files` | `string \| string[]` | `'^(?:vite\|next)\.config\.[cm]?[jt]s$'` | Regexes for the config file names that are checked; replaces the default |

```ts
'arch/files-externals': ['error', { packages: ['@napi-rs/*', 'pg', 'sharp'] }]
```
