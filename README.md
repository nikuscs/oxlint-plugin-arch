# 🏛️ oxlint-plugin-arch

> Architecture rules for [Oxlint](https://oxc.rs): files in the right folders, exports named after their file, types where they belong.

Linters catch bugs; this catches drift. Describe your folders once, and the preset wires the right rules into each one: apps, backends, libraries, UI kits and scripts. Relax a folder by changing one key, not by writing overrides.

## ✨ Features

- 🗂️ **Folders, not flags.** Each folder says what it holds (`react`, `tanstack`, `backend`, `kit`); nested folders inherit and refine.
- 🏷️ **Filename-aware.** Rules derive names from the file they run on: `user-action.create.ts` must export `userActionCreate`.
- 🎛️ **Configurable.** No app names or paths baked in. Every rule works on its own too.
- 🛟 **Safe autofix.** 🔧 rules only touch whitespace or comments.
- ⚡ **Fast.** Oxlint's JS plugin API, no extra parser.

## 🧰 Built with

[Oxlint](https://oxc.rs) · [oxlint-tsgolint](https://github.com/oxc-project/tsgolint) · [Bun](https://bun.sh) · TypeScript

## 🚀 Install in 3 steps

**You need:** Oxlint 1.85 or newer.

**1. Install**

```sh
bun add -d oxlint oxlint-tsgolint oxlint-plugin-arch
# React, Tailwind and shadcn groups (the tanstack, next, expo, react and ui recipes):
bun add -d eslint-plugin-react eslint-plugin-react-you-might-not-need-an-effect eslint-plugin-svg-jsx oxlint-tailwindcss @shadcn/lint
```

**2. Add the preset**

```ts
// oxlint.config.ts
import { preset } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    'packages/ui': { react: { a11y: false } },
  },
})
```

The preset detects each workspace from its `package.json` (TanStack, Next, Expo, backend, UI kit, library) along with its stylesheet, service registry and migrations. List only the folders you want to change. Detection, inheritance, groups, recipes and templates: [docs/folders.md](docs/folders.md). Rules without the preset: [docs/plugin-only.md](docs/plugin-only.md).

**3. Lint**

```sh
bunx oxlint
```

## 📚 Groups and rules

<!-- generated:start -->
On by default: [`layout`](docs/groups/layout.md), [`limits`](docs/groups/limits.md), [`style`](docs/groups/style.md), [`basics`](docs/groups/basics.md), [`naming`](docs/groups/naming.md), [`comments`](docs/groups/comments.md), [`types`](docs/groups/types.md), [`imports`](docs/groups/imports.md), [`tests`](docs/groups/tests.md), [`deny`](docs/groups/deny.md), [`externals`](docs/groups/externals.md).

Opt-in: [`react`](docs/groups/react.md), [`tanstack`](docs/groups/tanstack.md), [`next`](docs/groups/next.md), [`expo`](docs/groups/expo.md), [`tailwind`](docs/groups/tailwind.md), [`shadcn`](docs/groups/shadcn.md), [`kit`](docs/groups/kit.md), [`backend`](docs/groups/backend.md), [`orpc`](docs/groups/orpc.md), [`schemas`](docs/groups/schemas.md), [`forms`](docs/groups/forms.md), [`sql`](docs/groups/sql.md), [`console`](docs/groups/console.md).

65 rules, IDs `arch/<rule>`. 🔧 = autofix.

| Family | Covers | Rules |
| --- | --- | --- |
| `backend` | Service and RPC structure | [`backend-orpc-output`](docs/rules/backend-orpc-output.md), [`backend-registry`](docs/rules/backend-registry.md), [`backend-service-functions`](docs/rules/backend-service-functions.md), [`backend-sql-like`](docs/rules/backend-sql-like.md) |
| `boundaries` | Import and runtime boundaries | [`boundaries-deny`](docs/rules/boundaries-deny.md), [`boundaries-imports`](docs/rules/boundaries-imports.md), [`boundaries-next`](docs/rules/boundaries-next.md), [`boundaries-rpc-database`](docs/rules/boundaries-rpc-database.md), [`boundaries-tanstack`](docs/rules/boundaries-tanstack.md), [`boundaries-token-owner`](docs/rules/boundaries-token-owner.md) |
| `code` | Code shapes to avoid | [`code-constructor`](docs/rules/code-constructor.md), [`code-double-negation`](docs/rules/code-double-negation.md), [`code-literal-in`](docs/rules/code-literal-in.md), [`code-mutable-state`](docs/rules/code-mutable-state.md), [`code-object-params`](docs/rules/code-object-params.md), [`code-paired-call`](docs/rules/code-paired-call.md), [`code-promise-mutation`](docs/rules/code-promise-mutation.md), [`code-switch`](docs/rules/code-switch.md), [`code-trivial-functions`](docs/rules/code-trivial-functions.md) |
| `comments` | Comments and directives | [`comments-code`](docs/rules/comments-code.md) 🔧, [`comments-directives`](docs/rules/comments-directives.md) |
| `copy` | User-facing text | [`copy-dashes`](docs/rules/copy-dashes.md) |
| `files` | What a file may contain or export | [`files-components-only`](docs/rules/files-components-only.md), [`files-constants-only`](docs/rules/files-constants-only.md), [`files-domain-constants`](docs/rules/files-domain-constants.md), [`files-exports`](docs/rules/files-exports.md), [`files-externals`](docs/rules/files-externals.md), [`files-factory-keys`](docs/rules/files-factory-keys.md), [`files-helpers`](docs/rules/files-helpers.md), [`files-no-functions`](docs/rules/files-no-functions.md), [`files-restricted`](docs/rules/files-restricted.md), [`files-route`](docs/rules/files-route.md), [`files-types-only`](docs/rules/files-types-only.md) |
| `layout` | Layout a formatter leaves alone | [`layout-call-arguments`](docs/rules/layout-call-arguments.md) 🔧, [`layout-call-array`](docs/rules/layout-call-array.md) 🔧, [`layout-chain`](docs/rules/layout-chain.md) 🔧, [`layout-jsx-attributes`](docs/rules/layout-jsx-attributes.md) 🔧, [`layout-key-value`](docs/rules/layout-key-value.md) 🔧, [`layout-object`](docs/rules/layout-object.md) 🔧, [`layout-padding`](docs/rules/layout-padding.md) 🔧, [`layout-ternary`](docs/rules/layout-ternary.md) 🔧 |
| `naming` | File, folder and export names | [`naming-declarations`](docs/rules/naming-declarations.md), [`naming-exports`](docs/rules/naming-exports.md), [`naming-file`](docs/rules/naming-file.md), [`naming-folder`](docs/rules/naming-folder.md), [`naming-types`](docs/rules/naming-types.md) |
| `react` | Components, effects, class names | [`react-dynamic-classes`](docs/rules/react-dynamic-classes.md), [`react-empty-effect`](docs/rules/react-empty-effect.md), [`react-memo`](docs/rules/react-memo.md), [`react-props`](docs/rules/react-props.md) |
| `schemas` | Schema placement | [`schemas-inline`](docs/rules/schemas-inline.md), [`schemas-local`](docs/rules/schemas-local.md), [`schemas-rederive`](docs/rules/schemas-rederive.md), [`schemas-single-use`](docs/rules/schemas-single-use.md) |
| `tests` | Test structure | [`tests-assertions`](docs/rules/tests-assertions.md), [`tests-concurrent-db`](docs/rules/tests-concurrent-db.md), [`tests-modifiers`](docs/rules/tests-modifiers.md), [`tests-titles`](docs/rules/tests-titles.md) |
| `types` | Type placement and shape | [`types-declarations`](docs/rules/types-declarations.md), [`types-imported-alias`](docs/rules/types-imported-alias.md), [`types-inline`](docs/rules/types-inline.md), [`types-local-alias`](docs/rules/types-local-alias.md), [`types-namespace-import`](docs/rules/types-namespace-import.md), [`types-service`](docs/rules/types-service.md), [`types-unknown`](docs/rules/types-unknown.md) |
<!-- generated:end -->

Also bundled: [Dillon Mulroy's anti-slop rules](docs/vendor.md) as `oxlint-plugin-arch/dillon-anti-slop`.

> [!WARNING]
> Upgrading from 0.11 or earlier: the preset API, rule IDs and entry points changed. See the [changelog](CHANGELOG.md).

## 📄 License

MIT. The `dillon-anti-slop` rules are by [Dillon Mulroy](https://github.com/dmmulroy/anti-slop), MIT, vendored with [attribution](src/vendor/dillon-anti-slop/UPSTREAM.md).
