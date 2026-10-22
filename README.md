# 🏛️ oxlint-plugin-arch

> Architecture rules for [Oxlint](https://oxc.rs), driven by filenames and fully configurable.

Keep a codebase shaped the way you designed it: files in the right folders, exports named after their file, types where they belong, and no shortcuts across boundaries. Every rule is generic, so **you** decide the paths, names, and policy in your own Oxlint config.

- 🗂️ **Filename-aware.** Rules derive expected names from the file they run on (`user-action.create.ts` → `makeUserActionCreate`).
- 🎛️ **Configurable.** No app names, folders, or libraries are baked in. Globs and policy live in your config.
- 🛟 **Safe autofix.** Layout and comment rules touch whitespace or comments; `object-multiline` and `call-arguments-multiline` can also add trailing commas. Type-import fixes qualify scope-resolved references and skip unsafe rewrites.
- ⚡ **Fast.** Built on Oxlint's JS plugin API and ESTree, with no extra parser.

## Two ways to use it

| | You get | Start here |
| --- | --- | --- |
| **Preset** | A ready policy for React apps with a typed backend (TanStack Start, Next.js, or both). Folders map to roles; every rule is already wired. | [Preset docs](docs/preset/README.md) |
| **Rules only** | 46 generic `arch/*` rules. You pick rules, globs and options in your own config. | [Install](#-install) |

## 🚀 Preset in 30 seconds

```sh
bun add -d oxlint oxlint-tsgolint oxlint-plugin-arch
```

```ts
// oxlint.config.ts
import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: {
    'apps/web': 'web',
    'apps/server': 'server',
    scripts: 'scripts',
    packages: 'packages',
  },
});
```

For a Next.js app use `oxlint-plugin-arch/presets/next-react-modules-preset`. See [architecture](docs/preset/architecture.md), [frameworks](docs/preset/frameworks.md) and [options](docs/preset/options.md).

## 📦 Install

```bash
bun add -d oxlint-plugin-arch oxlint @oxlint/plugins
```

> [!NOTE]
> Keep `oxlint` and `@oxlint/plugins` on matching versions.

Register the plugin in `oxlint.config.ts`:

```ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: 'oxlint-plugin-arch' },
  ],
})
```

Then turn rules on per folder with `overrides`:

```ts
export default defineConfig({
  jsPlugins: [{ name: 'arch', specifier: 'oxlint-plugin-arch' }],
  rules: {
    'arch/no-literal-in': 'error',
  },
  overrides: [
    {
      files: ['**/src/components/**/*.tsx'],
      rules: {
        'arch/only-export-components': ['error', { matchFileName: true }],
      },
    },
    {
      files: ['**/*.test.ts'],
      rules: {
        'arch/test-title-pattern': ['error', { forbid: '^should\\b', flags: 'i' }],
      },
    },
  ],
})
```

To also use the `modules/*` and `dillon-anti-slop/*` rule sets without the preset, see [using the plugins without the preset](docs/plugins.md).

## 📚 Examples

| File | Use it when |
| --- | --- |
| [`minimal.oxlint.config.ts`](examples/minimal.oxlint.config.ts) | You want the smallest possible starting point. |
| [`monorepo.oxlint.config.ts`](examples/monorepo.oxlint.config.ts) | ⭐ You are starting an `apps/server` + `apps/web` monorepo and want a strict, copy-ready setup. |
| [`full.oxlint.config.ts`](examples/full.oxlint.config.ts) | You want to see every `arch/*` rule with its options. |
| [`preset.oxlint.config.ts`](examples/preset.oxlint.config.ts) | You use the TanStack Start preset with layouts, migrations and a policy callback. |
| [`mixed-frameworks.oxlint.config.ts`](examples/mixed-frameworks.oxlint.config.ts) | You use the generic preset with Next.js App Router and TanStack Start web roots in one config. |

> [!TIP]
> `monorepo.oxlint.config.ts` and the preset examples already load `oxlint-plugin-arch`, so you can copy them as-is. `minimal` and `full` load `../src/index.ts`; change that specifier to `oxlint-plugin-arch` when you copy them.

## 🧩 Rules

🔧 means the rule can autofix. Each rule links to its page with examples and options.

Options that take one regex string (`pattern`, `allowPattern`, `forbid`, `require`, and the other `*Pattern` options) also take a non-empty list; any pattern in the list may match. Options that were already lists, such as `allowPatterns` and `allowCallees`, are unchanged.

### `arch/*`

#### 📁 Files & folders

| Rule | What it enforces |
| --- | --- |
| [`filename-match`](docs/rules/arch/filename-match.md) | Filenames match a pattern you configure. |
| [`folder-prefix`](docs/rules/arch/folder-prefix.md) | Filenames start with their parent folder name, or the folders after a root you choose. |
| [`no-restricted-files`](docs/rules/arch/no-restricted-files.md) | Files matching a glob you forbid are reported, for example misplaced `*.types.ts`. |

#### 🏷️ Naming & exports

| Rule | What it enforces |
| --- | --- |
| [`declaration-name`](docs/rules/arch/declaration-name.md) | Selected declarations start with a prefix taken from the filename, or match a pattern. |
| [`export-file-prefix`](docs/rules/arch/export-file-prefix.md) | Names start with the filename prefix. |
| [`export-name-pattern`](docs/rules/arch/export-name-pattern.md) | Export names (or every function and type) match a regular expression. |
| [`filename-export-name`](docs/rules/arch/filename-export-name.md) | Function names follow a template built from the filename. |
| [`no-extra-exports`](docs/rules/arch/no-extra-exports.md) | A file exports only the names you allow. |
| [`only-export-constants`](docs/rules/arch/only-export-constants.md) | Constant files export only local `const` values. |

#### 🏭 Functions & factories

| Rule | What it enforces |
| --- | --- |
| [`require-file-factory`](docs/rules/arch/require-file-factory.md) | The file defines the factory function its filename promises. |
| [`no-extra-factory-keys`](docs/rules/arch/no-extra-factory-keys.md) | A factory returns only the keys you allow. |
| [`require-object-params`](docs/rules/arch/require-object-params.md) | Functions take object parameters instead of long positional lists. |
| [`no-file-level-helpers`](docs/rules/arch/no-file-level-helpers.md) | No stray helper functions at module scope. |
| [`no-top-level-functions`](docs/rules/arch/no-top-level-functions.md) | No top-level functions (and optionally no re-exports) in matched files. |
| [`no-trivial-functions`](docs/rules/arch/no-trivial-functions.md) | No empty or pass-through functions. |
| [`no-module-mutable-state`](docs/rules/arch/no-module-mutable-state.md) | No module-level `let`/`var`, which is shared across requests and tests. |

#### 🔷 Types

| Rule | What it enforces |
| --- | --- |
| [`no-inline-types`](docs/rules/arch/no-inline-types.md) | Function signatures use named types instead of inline `{ ... }` objects. |
| [`no-type-declarations`](docs/rules/arch/no-type-declarations.md) | No type aliases or interfaces in matched files, so types live in one place. |
| [`no-runtime-in-types`](docs/rules/arch/no-runtime-in-types.md) | Type modules stay free of runtime code. |
| [`no-imported-type-alias`](docs/rules/arch/no-imported-type-alias.md) | No exported aliases that only rename an imported type. |
| [`prefer-namespace-type-import`](docs/rules/arch/prefer-namespace-type-import.md) 🔧 | Long type-only named imports become a namespace import with qualified references. |

#### 🧪 Schemas & APIs

| Rule | What it enforces |
| --- | --- |
| [`no-local-schema-construction`](docs/rules/arch/no-local-schema-construction.md) | No schemas built outside the files that own them. |
| [`no-inline-schema-elements`](docs/rules/arch/no-inline-schema-elements.md) | Named schemas inside combinators like `z.array(...)`. |
| [`no-rederive-schema`](docs/rules/arch/no-rederive-schema.md) | No re-deriving types from schemas imported from elsewhere. |
| [`no-single-use-scalar-schema`](docs/rules/arch/no-single-use-scalar-schema.md) | Reports scalar Zod aliases that are used only once. |
| [`require-orpc-output`](docs/rules/arch/require-orpc-output.md) | oRPC procedures declare a named `.output()` schema. |
| [`no-unescaped-like`](docs/rules/arch/no-unescaped-like.md) | `LIKE` / `ILIKE` values pass through your sanitizer. |

#### 🚧 Boundaries & safety

| Rule | What it enforces |
| --- | --- |
| [`no-restricted-token`](docs/rules/arch/no-restricted-token.md) | Identifiers or member calls appear only in owner files. |
| [`no-restricted-constructor`](docs/rules/arch/no-restricted-constructor.md) | No `new Error()` (or any constructor you list) where typed errors are required. |
| [`require-paired-call`](docs/rules/arch/require-paired-call.md) | Calling one function requires calling another, for example `useForm` with a schema resolver. |
| [`no-promise-all-mutation`](docs/rules/arch/no-promise-all-mutation.md) | No `results.push(...)` or `total += x` on outer variables inside `Promise.all`. Return values instead. |
| [`no-literal-in`](docs/rules/arch/no-literal-in.md) | No `'key' in value`. Use `Object.hasOwn()` or a discriminated union. |

#### ⚛️ React

| Rule | What it enforces |
| --- | --- |
| [`component-props`](docs/rules/arch/component-props.md) | Components type props with `interface XProps` declared directly above them. |
| [`only-export-components`](docs/rules/arch/only-export-components.md) | Component files export only components, named after the file. |
| [`route-surface`](docs/rules/arch/route-surface.md) | Route files export only the route, with no banned hooks or raw JSX. |

#### 💬 Comments & tests

| Rule | What it enforces |
| --- | --- |
| [`no-comments`](docs/rules/arch/no-comments.md) 🔧 | No comments in matched files, except directives and `Why:` notes. |
| [`no-member-comments`](docs/rules/arch/no-member-comments.md) 🔧 | No comments on interface, type, and object members. |
| [`test-title-pattern`](docs/rules/arch/test-title-pattern.md) | Test titles match your rules, for example no leading "should". |

#### 🎨 Layout

| Rule | What it enforces |
| --- | --- |
| [`padding-between-statements`](docs/rules/arch/padding-between-statements.md) 🔧 | Blank lines around functions, classes, control flow and late returns. |
| [`object-multiline`](docs/rules/arch/object-multiline.md) 🔧 | Objects with 3+ properties passed to a call go one property per line. |
| [`ternary-layout`](docs/rules/arch/ternary-layout.md) 🔧 | Join short conditionals or split long ones before `?` and `:`. |
| [`call-arguments-multiline`](docs/rules/arch/call-arguments-multiline.md) 🔧 | Calls and constructors with 3+ arguments go one argument per line. |
| [`key-value-same-line`](docs/rules/arch/key-value-same-line.md) 🔧 | An object key and the start of its value stay on the same line. |
| [`chain-newline`](docs/rules/arch/chain-newline.md) 🔧 | Long method chains go one call per line. |
| [`call-array-multiline`](docs/rules/arch/call-array-multiline.md) 🔧 | Arrays passed to `Promise.all` (or callees you list) go one element per line. |
| [`jsx-attributes-multiline`](docs/rules/arch/jsx-attributes-multiline.md) 🔧 | JSX tags with 3+ attributes go one attribute per line. |

> [!WARNING]

### `modules/*`

Rules the preset uses to keep its policies from overwriting each other. You can also register them on their own.

| Rule | What it enforces |
| --- | --- |
| [`backend-switch`](docs/rules/modules/backend-switch.md) | Do not use `switch` in backend application code. Use ts-pattern instead. |
| [`concurrent-db`](docs/rules/modules/concurrent-db.md) | Concurrent tests must not destructure a `db` fixture. Use an isolated database fixture instead. |
| [`domain-constants`](docs/rules/modules/domain-constants.md) | Move module data to a domain `.constants.ts` file. Do not keep SCREAMING_SNAKE constants (or configured data) in the service file. |
| [`double-negation`](docs/rules/modules/double-negation.md) | Do not coerce with `!!`. Use `Boolean(value)` or an explicit comparison. |
| [`dynamic-classes`](docs/rules/modules/dynamic-classes.md) | Write complete `className` strings. Do not build them with template expressions or `+`. |
| [`empty-effect`](docs/rules/modules/empty-effect.md) | Remove `useEffect` / `useLayoutEffect` callbacks whose body is empty. |
| [`import-boundaries`](docs/rules/modules/import-boundaries.md) | Reject imports that cross configured application boundaries, including type-only imports. |
| [`local-type-alias`](docs/rules/modules/local-type-alias.md) | Do not declare type aliases in component and hook files. Use an interface named for the owner, or move derived aliases to domain types. |
| [`memoization`](docs/rules/modules/memoization.md) | Do not import or call React `memo`, `useMemo` or `useCallback`. Use the React Compiler. Unrelated `cache.memo` calls are left alone. |
| [`next-runtime`](docs/rules/modules/next-runtime.md) | Check Next.js runtime ownership from file names and directives. `.server` / `.rsc` and `'use server'` modules stay off the browser. `.client` and `'use client'` modules stay off server-only APIs. Shared modules use neither. |
| [`no-unknown`](docs/rules/modules/no-unknown.md) | Do not write the `unknown` type. Use an owned domain type. |
| [`pascal-interface`](docs/rules/modules/pascal-interface.md) | Interface names must be PascalCase. |
| [`reasoned-directives`](docs/rules/modules/reasoned-directives.md) | Lint disables must name specific rules and explain why after `--`. |
| [`rpc-database`](docs/rules/modules/rpc-database.md) | RPC handlers must not call the database. Delegate that work to services. |
| [`service-functions`](docs/rules/modules/service-functions.md) | Keep backend operations strict. Frontend modules may expose several operations, with helpers nested inside them. |
| [`service-types`](docs/rules/modules/service-types.md) | Only the matching factory-derived `Service` alias may stay in a service file. Types such as `ChatDeps` belong in domain types. |
| [`shape-suffix`](docs/rules/modules/shape-suffix.md) | Do not name a declaration with a `Shape` suffix. Name it for its domain role. |
| [`tanstack-runtime`](docs/rules/modules/tanstack-runtime.md) | Check direct runtime dependencies and imported TanStack execution boundaries. Compilation still owns graph isolation. |
| [`test-assertions`](docs/rules/modules/test-assertions.md) | Every test case must contain a recognized assertion, and `expect` calls must sit inside a test or assertion helper. |
| [`test-modifiers`](docs/rules/modules/test-modifiers.md) | Reject focused, skipped and placeholder tests, including renamed imports such as `check.only`. |

### `dillon-anti-slop/*`

15 vendored [anti-slop](https://github.com/dmmulroy/anti-slop) rules by Dillon Mulroy. [List](docs/rules/dillon-anti-slop.md).

## ⚡ Benchmarks

Wall time for a full `oxlint` run over three real TypeScript monorepos, best of 5, including process startup.

| Project | Files | Lines | Plugin loaded, no rules | [Monorepo example](examples/monorepo.oxlint.config.ts) | All 42 rules on every file |
| --- | ---: | ---: | ---: | ---: | ---: |
| Small | 246 | 14.5k | 0.09s | **0.20s** | 0.23s |
| Medium | 792 | 100.5k | 0.10s | **0.49s** | 0.69s |
| Large | 1,880 | 190k | 0.10s | **0.72s** | 1.08s |

## 📄 License

MIT
