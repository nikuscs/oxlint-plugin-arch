# Using the plugins without the preset

Register only the rule sets you need. This does not enable the preset. Back to the [README](../README.md).

```ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: 'oxlint-plugin-arch' },
    { name: 'dillon-anti-slop', specifier: 'oxlint-plugin-arch/rules/dillon-anti-slop' },
    { name: 'modules', specifier: 'oxlint-plugin-arch/rules/module-policy' },
  ],
  rules: {
    'arch/no-literal-in': 'error',
    'dillon-anti-slop/no-chained-type-assertions': 'error',
    'modules/no-unknown': 'error',
  },
})
```

- Each entry point has a default export and TypeScript types. Do not import `dist/` paths.
- Rule lists: [`arch/*`](../README.md#arch), [`modules/*`](../README.md#modules), [`dillon-anti-slop/*`](rules/dillon-anti-slop.md).

## Third-party plugins

Copying the preset's plugin registrations into your own config? Install them yourself (`bun add -d`); do not rely on hoisting.

| Scope | Packages |
| --- | --- |
| Always | `oxlint-plugin-eslint`, `eslint-plugin-import`, `@regru/eslint-plugin-prefer-early-return`, `eslint-plugin-unused-imports`, `eslint-plugin-perfectionist`, `eslint-plugin-tsdoc`, `@eslint-community/eslint-plugin-eslint-comments` |
| Web roots | `eslint-plugin-react`, `eslint-plugin-react-you-might-not-need-an-effect`, `eslint-plugin-svg-jsx` |
| CSS entry points with Tailwind enabled | `oxlint-tailwindcss` |
| Same CSS scope with shadcn enabled | `@shadcn/lint` |

| Package | In `oxlint-plugin-arch` |
| --- | --- |
| plugins above | dependencies (the preset loads its own copies) |
| `oxlint` | peer dependency |
| `oxlint-tsgolint` | optional peer, needed for the preset's type-aware rules |
| `@oxlint/plugins` | runtime dependency of the bundled plugins |

- App config: list plugins you use directly as devDependencies.
- Shared config package: dependencies for plugins it resolves itself, peerDependencies if consumers supply them.
