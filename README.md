# 🏛️ oxlint-plugin-arch

> Architecture rules for [Oxlint](https://oxc.rs), driven by filenames and fully configurable.

Keep a codebase shaped the way you designed it: files in the right folders, exports named after their file, types where they belong, and no shortcuts across boundaries. Rules are generic; paths, names and policy live in your Oxlint config.

## 🚀 Preset

A ready policy for React apps with a typed backend (TanStack Start, Next.js, or both).

```sh
bun add -d oxlint oxlint-tsgolint oxlint-plugin-arch
```

```ts
// oxlint.config.ts
import { tanstackStartReactModulesPreset } from 'oxlint-plugin-arch/preset'

export default tanstackStartReactModulesPreset({
  root: import.meta.dirname,
  architecture: {
    'apps/web': 'web',
    'apps/server': 'server',
    scripts: 'scripts',
    packages: 'packages',
  },
})
```

`nextReactModulesPreset` and `reactModulesPreset` take the same options.

## 📦 Rules only

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [{ name: 'arch', specifier: 'oxlint-plugin-arch' }],
  rules: {
    'arch/layout-object': ['error', { minProperties: 3 }],
  },
})
```

The vendored [anti-slop rules](src/vendor/dillon-anti-slop/UPSTREAM.md) by Dillon Mulroy register as `{ name: 'dillon-anti-slop', specifier: 'oxlint-plugin-arch/dillon-anti-slop' }`.

## 📚 Rules

🔧 marks rules with a safe autofix.

| Family | Covers | Rules |
| --- | --- | --- |
| `backend` | Service and RPC structure | `backend-orpc-output`, `backend-service-functions`, `backend-sql-like` |
| `boundaries` | Import and runtime boundaries | `boundaries-imports`, `boundaries-next`, `boundaries-rpc-database`, `boundaries-tanstack`, `boundaries-token-owner` |
| `code` | Code shapes to avoid | `code-constructor`, `code-double-negation`, `code-literal-in`, `code-mutable-state`, `code-object-params`, `code-paired-call`, `code-promise-mutation`, `code-switch`, `code-trivial-functions` |
| `comments` | Comments and directives | `comments` 🔧, `comments-directives`, `comments-members` 🔧 |
| `files` | What a file may contain or export | `files-components-only`, `files-constants-only`, `files-domain-constants`, `files-exports`, `files-factory`, `files-factory-keys`, `files-helpers`, `files-no-functions`, `files-restricted`, `files-route`, `files-types-only` |
| `layout` | Statement and expression layout | `layout-call-arguments` 🔧, `layout-call-array` 🔧, `layout-chain` 🔧, `layout-jsx-attributes` 🔧, `layout-key-value` 🔧, `layout-object` 🔧, `layout-padding` 🔧, `layout-ternary` 🔧 |
| `naming` | File, folder and export names | `naming-declarations`, `naming-export-pattern`, `naming-export-prefix`, `naming-export-template`, `naming-file`, `naming-folder`, `naming-shape`, `naming-types` |
| `react` | React components and hooks | `react-dynamic-classes`, `react-empty-effect`, `react-memo`, `react-props` |
| `schemas` | Schema placement | `schemas-inline`, `schemas-local`, `schemas-rederive`, `schemas-single-use` |
| `tests` | Test structure | `tests-assertions`, `tests-concurrent-db`, `tests-modifiers`, `tests-titles` |
| `types` | Type placement and shape | `types-declarations`, `types-imported-alias`, `types-inline`, `types-local-alias`, `types-namespace-import` 🔧, `types-service`, `types-unknown` |

Upgrading from 0.11 or earlier: rule IDs and entry points changed; see the [changelog](CHANGELOG.md).

## License

MIT
