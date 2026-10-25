# 🔌 Rules without the preset

Register the plugins and pick rules. Every rule takes its options in your config.

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: 'oxlint-plugin-arch' },
    { name: 'dillon-anti-slop', specifier: 'oxlint-plugin-arch/dillon-anti-slop' },
  ],
  rules: {
    'arch/layout-object': ['error', { minProperties: 3 }],
    'dillon-anti-slop/no-reflect-get': 'error',
  },
  overrides: [
    {
      files: ['src/hooks/**/*.ts'],
      rules: { 'arch/naming-exports': ['error', { mode: 'pattern', pattern: '^use[A-Z]' }] },
    },
  ],
})
```

Rule pages: [`docs/rules`](rules). Anti-slop rules: [vendor.md](vendor.md).
