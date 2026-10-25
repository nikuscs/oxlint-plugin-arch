# Changelog

## Unreleased

### Breaking: rebuilt package

- Every owned rule is now `arch/<family>-<subject>`; the `modules` plugin is gone. Update configs and `oxlint-disable` comments with the table below. Old IDs are not aliased: an old ID in a disable comment no longer suppresses anything.
- Entry points: `oxlint-plugin-arch` (rules), `oxlint-plugin-arch/preset` (`preset`, `recipes`, `templates`, `PresetError` and the option types) and `oxlint-plugin-arch/dillon-anti-slop`. The `presets/*` and `rules/*` subpaths are removed.
- Selector rules (`code-switch`, `code-double-negation`, `naming-types`, `types-local-alias`, `react-empty-effect`, `react-dynamic-classes`, `boundaries-rpc-database`, `tests-concurrent-db`) accept an optional `message` option.
- The preset is `preset({ root, folders })`: folders map to groups, nested folders inherit and refine, recipes and templates hold shared defaults. `reactModulesPreset`, `nextReactModulesPreset`, `tanstackStartReactModulesPreset`, `architecture`, roles, `policies`, `ruleSeverities` and `ruleExclusions` are removed; see the option table below. Expo apps get an `expo` group. `naming-shape` in the preset is replaced by `dillon-anti-slop/no-shape-in-symbol-names`. Invalid folders and options throw `PresetError`.
- Rule options use one short vocabulary (`allow`, `deny`, `min`, `max`, `message`, ...); see the rule option table below. Old option names are not aliased and fail schema validation. Defaults are unchanged. Rule behavior and messages are otherwise unchanged apart from the fixes under Fixed (two messages that named an option now name the new one); checked by running the 0.11 rule tests against the new rules, and by linting two consumer monorepos with equivalent folder configs.
- Merged rules: `naming-export-prefix`, `naming-export-pattern` and `naming-export-template` are now `naming-exports`, one check per option object (`mode: 'prefix' | 'pattern' | 'template'`), so several checks can share a file: `['error', { mode: 'prefix' }, { mode: 'pattern', pattern: '^use[A-Z]' }]`. `allDeclarations: true` → `scope: 'declarations'`, `allFunctions: true` → `scope: 'functions'`, `naming-export-template`'s `mode: 'all' | 'some'` → `match`; the other options follow the rule option table. `files-factory` is now `files-exports` with `factory` (its `allDeclarations: true` → `scope: 'declarations'`; `names` is no longer required). `comments-members` is now `comments-code` with `members: 'only'` (`'also'` adds member checks to the normal ones). `naming-shape` is removed; use `dillon-anti-slop/no-shape-in-symbol-names`. `code-switch` now defaults to `'Avoid switch statements.'`. Message IDs and texts are unchanged, apart from the fixes under Fixed.
- Docs: `docs/folders.md`, one page per group in `docs/groups/`, one page per rule in `docs/rules/`, `docs/vendor.md` and `docs/plugin-only.md`. The README group and rule tables are generated (`bun run docs`).
- New `arch/copy-dashes`: reports em dashes in strings, template text and JSX text. On in the preset as `style.dashes`.
- React plugins, `oxlint-tailwindcss` and `@shadcn/lint` are optional peer dependencies, loaded only when a folder turns on their group; a missing one throws `PresetError` with the install command.
- `bun run bench <repo>` times every rule against a consumer repo and prints the slowest.
- Architecture checks that needed vitest tests are now lint:
  - `deny` group (on, empty): per-folder `imports` and `calls` bans, inherited and merged down the tree, via the new `arch/boundaries-deny` (static, re-export and literal dynamic imports).
  - `externals` group (on): new `arch/files-externals` checks `ssr.external` in `vite.config.*` and `serverExternalPackages` in `next.config.*` against `package.json`; `externals` exports the default must-stay-external list.
  - `backend.registry`: new `arch/backend-registry`, every `services/<domain>/` has `<domain>.service.ts` and is listed in the registry file. `backend.writes`: methods query files may not call (Kysely writes by default).
  - `layout.strict` (closed set of domain file roles), `layout.operations: 'folders'` (`actions/` and `queries/` with `make…` factories), `layout.service` (allowed `.service.ts` exports).
  - `naming.files` and `naming.exports` take a regex for the folder; `naming.unique` keeps a file name part unique per folder (migration numbers), via the new `unique` option of `arch/naming-file`.
  - `tanstack` keeps `@tanstack/react-start/rsc` in `services/*.rsc.{ts,tsx}`; `expo` checks Expo Router file names and keeps route files free of helpers.
  - Folder `rules` take `[level, options]` as well as a level.

| Old preset option | New |
| --- | --- |
| `tanstackStartReactModulesPreset(...)` | `preset({ root, folders })` |
| `architecture: { 'apps/web': 'web' }` | `folders: { 'apps/web': recipes.tanstack }` (`recipes.next`, `recipes.expo`) |
| role `server` / `runner` | `recipes.backend` |
| role `packages` | `recipes.library` (`'packages/*'` for a folder of packages) |
| role `scripts`, `cliFiles` | `recipes.cli` on the folder |
| entry `layout: { services: 'flat' }`, `sourceDir` | folder `layout: { services: 'flat' }`, `source` |
| `framework` | the `tanstack` / `next` / `expo` group on the folder |
| `severity` | folder `severity` |
| `ruleSeverities`, `ruleExclusions` | folder `rules: { 'arch/x': 'warn' \| 'off' }` |
| `policies: { x: false }` | the group set to `false` on the folder |
| `ignorePatterns` | the folder set to `false` |
| `formatting.semi`, `formatting.quotes` | `style.semicolons`, `style.quotes` |
| `limits.maxFileLines`, `maxTypeFileLines`, `maxFunctionComplexity` | `limits.lines`, `limits.types`, `limits.complexity` |
| `modules.customFileRoles` | `layout.suffixes` |
| `modules.migrationFiles` | the migrations folder with `layout: false` |
| `modules.colocatedTypeFiles` | `types.colocated` |
| `imports.backendEntryPoints`, `aliases`, `internalSortPatterns` | `backend.exports`, `imports.aliases`, `imports.internal` |
| `orpc.publicProcedureFiles`, `outputSchemaComposers`, `clientOwnerFile` | `orpc.public`, `orpc.composers`, `orpc.client` |
| `sql.likeSanitizers`, `forms.schemaResolver` | `sql.sanitizers`, `forms.resolver` |
| `react.compiler`, `react.componentProps` | `react.compiler`, `react.props` |
| `tests.profile`, `additionalTestFunctions`, `additionalAssertionFunctions`, `mocking` | `tests.fixtures`, `tests.functions`, `tests.assertions`, `tests.mocking` |
| `tanstackStart.*` / `next.*` server, client, computed imports | `tanstack` / `next` group `server`, `client`, `dynamic` |
| `tailwind.cssEntryPoint(sByRoot)`, `rootFontSize` | folder `tailwind.css`, `tailwind.rem` |
| `shadcn.ui`, `shadcn.components` | `shadcn.ui`, `shadcn.components`; mark UI kit packages with `kit: true` |

| Old ID | New ID |
| --- | --- |
| `arch/call-arguments-multiline` | `arch/layout-call-arguments` |
| `arch/call-array-multiline` | `arch/layout-call-array` |
| `arch/chain-newline` | `arch/layout-chain` |
| `arch/component-props` | `arch/react-props` |
| `arch/declaration-name` | `arch/naming-declarations` |
| `arch/export-file-prefix` | `arch/naming-exports` |
| `arch/export-name-pattern` | `arch/naming-exports` (`mode: 'pattern'`) |
| `arch/filename-export-name` | `arch/naming-exports` (`mode: 'template'`) |
| `arch/filename-match` | `arch/naming-file` |
| `arch/folder-prefix` | `arch/naming-folder` |
| `arch/jsx-attributes-multiline` | `arch/layout-jsx-attributes` |
| `arch/key-value-same-line` | `arch/layout-key-value` |
| `arch/no-comments` | `arch/comments-code` |
| `arch/no-extra-exports` | `arch/files-exports` |
| `arch/no-extra-factory-keys` | `arch/files-factory-keys` |
| `arch/no-file-level-helpers` | `arch/files-helpers` |
| `arch/no-imported-type-alias` | `arch/types-imported-alias` |
| `arch/no-inline-schema-elements` | `arch/schemas-inline` |
| `arch/no-inline-types` | `arch/types-inline` |
| `arch/no-literal-in` | `arch/code-literal-in` |
| `arch/no-local-schema-construction` | `arch/schemas-local` |
| `arch/no-member-comments` | `arch/comments-code` (`members: 'only'`) |
| `arch/no-module-mutable-state` | `arch/code-mutable-state` |
| `arch/no-promise-all-mutation` | `arch/code-promise-mutation` |
| `arch/no-rederive-schema` | `arch/schemas-rederive` |
| `arch/no-restricted-constructor` | `arch/code-constructor` |
| `arch/no-restricted-files` | `arch/files-restricted` |
| `arch/no-restricted-token` | `arch/boundaries-token-owner` |
| `arch/no-runtime-in-types` | `arch/files-types-only` |
| `arch/no-single-use-scalar-schema` | `arch/schemas-single-use` |
| `arch/no-top-level-functions` | `arch/files-no-functions` |
| `arch/no-trivial-functions` | `arch/code-trivial-functions` |
| `arch/no-type-declarations` | `arch/types-declarations` |
| `arch/no-unescaped-like` | `arch/backend-sql-like` |
| `arch/object-multiline` | `arch/layout-object` |
| `arch/only-export-components` | `arch/files-components-only` |
| `arch/only-export-constants` | `arch/files-constants-only` |
| `arch/padding-between-statements` | `arch/layout-padding` |
| `arch/prefer-namespace-type-import` | `arch/types-namespace-import` |
| `arch/require-file-factory` | `arch/files-exports` (`factory`) |
| `arch/require-object-params` | `arch/code-object-params` |
| `arch/require-orpc-output` | `arch/backend-orpc-output` |
| `arch/require-paired-call` | `arch/code-paired-call` |
| `arch/route-surface` | `arch/files-route` |
| `arch/ternary-layout` | `arch/layout-ternary` |
| `arch/test-title-pattern` | `arch/tests-titles` |
| `modules/backend-switch` | `arch/code-switch` |
| `modules/concurrent-db` | `arch/tests-concurrent-db` |
| `modules/domain-constants` | `arch/files-domain-constants` |
| `modules/double-negation` | `arch/code-double-negation` |
| `modules/dynamic-classes` | `arch/react-dynamic-classes` |
| `modules/empty-effect` | `arch/react-empty-effect` |
| `modules/import-boundaries` | `arch/boundaries-imports` |
| `modules/local-type-alias` | `arch/types-local-alias` |
| `modules/memoization` | `arch/react-memo` |
| `modules/next-runtime` | `arch/boundaries-next` |
| `modules/no-unknown` | `arch/types-unknown` |
| `modules/pascal-interface` | `arch/naming-types` |
| `modules/reasoned-directives` | `arch/comments-directives` |
| `modules/rpc-database` | `arch/boundaries-rpc-database` |
| `modules/service-functions` | `arch/backend-service-functions` |
| `modules/service-types` | `arch/types-service` |
| `modules/shape-suffix` | `dillon-anti-slop/no-shape-in-symbol-names` |
| `modules/tanstack-runtime` | `arch/boundaries-tanstack` |
| `modules/test-assertions` | `arch/tests-assertions` |
| `modules/test-modifiers` | `arch/tests-modifiers` |

| Rule | Old option | New option |
| --- | --- | --- |
| `backend-orpc-output` | `handlerMethod`, `outputMethod` | `handler`, `output` |
| `backend-service-functions` | `allowLocalHelpers`, `allowReturnedMethods`, `singleExport` | `helpers`, `methods`, `single` |
| `backend-sql-like` | `allowSanitizedBindings`, `operatorMethods` | `bindings`, `operators` |
| `boundaries-imports` | `fileRoles`, `portableLib`, `publicEntrypoints` | `roles`, `portable`, `entrypoints` |
| `boundaries-next`, `boundaries-tanstack` | `serverImports`, `clientImports`, `allowComputedImportsIn` | `server`, `client`, `dynamic` |
| `boundaries-tanstack` | `rpcClients` | `rpc` |
| `boundaries-token-owner` (and each `restrictions[]` entry) | `allowIn`, `allowPathPatterns` | `allow`, `patterns` |
| `code-constructor` | `checkCalls` | `calls` |
| `code-mutable-state` | `allowNamePattern` | `allow` |
| `code-object-params` | `maxParams`, `allDeclarations`, `serviceMethods`, `allowPattern` | `max`, `all`, `services`, `allow` |
| `code-promise-mutation` | `checkAssignments` | `assignments` |
| `code-trivial-functions` | `allowPattern`, `allowCallees`, `allowAsync`, `checkServiceMethods`, `bannedNames`, `checkGenericGuards` | `allow`, `callees`, `async`, `services`, `deny`, `guards` |
| `comments-code` | `allowWhy`, `allowPatterns`, `allowJsdoc` | `why`, `allow`, `jsdoc` |
| `files-components-only` | `matchFileName`, `trailingRoles`, `allowTypeExports`, `denyTypePattern` | `filename`, `roles`, `types`, `deny` |
| `files-constants-only` | `allowFunctionValues`, `allowTypeExports`, `allowReExports` | `functions`, `types`, `reexports` |
| `files-domain-constants` | `includeData`, `allowServiceMethods` | `data`, `services` |
| `files-exports` | `domainStem`, `trailingRoles`, `roleSeparators`, `allowTypeExports`, `factoryScope` | `stem`, `roles`, `separators`, `types`, `scope` |
| `files-factory-keys` (and each `sets[]` entry) | `factoryPattern`, `requireKeys`, `keySets` | `factory`, `required`, `sets` |
| `files-helpers` | `allowPattern`, `detectComponents`, `hookPattern` | `allow`, `components`, `hooks` |
| `files-no-functions` | `banReExports`, `allowPattern` | `reexports`, `allow` |
| `files-route` | `exportName`, `allowedExports`, `inspectExports`, `bannedHooks`, `banIntrinsicJsx` | `export`, `exports`, `inspect`, `hooks`, `intrinsic` |
| `files-types-only` | `runtimeImports`, `allowImportSources`, `banReExports` | `imports`, `sources`, `reexports` |
| `layout-call-arguments` | `minArguments` | `min` |
| `layout-call-array` | `minElements` | `min` |
| `layout-chain` (`groups[]`) | `minDepth`, `onlyMethods`, `rootPattern` | `min`, `only`, `root` |
| `layout-jsx-attributes` | `minAttributes` | `min` |
| `layout-object` | `minProperties` | `min` |
| `layout-padding` | `returnMinStatements`, `multilineVariables` | `min`, `multiline` |
| `layout-ternary` | `maxLength` | `max` |
| `naming-declarations` | `trailingRoles`, `roleSeparators`, `allowPattern` | `roles`, `separators`, `allow` |
| `naming-exports` | `trailingRoles`, `roleSeparators`, `ignoreTypeExports`, `serviceMethods`, `allowPattern`, `placeholderPattern` | `roles`, `separators`, `types`, `services`, `allow`, `placeholder` |
| `naming-folder` | `stripPrefixes` | `prefixes` |
| `react-props` | `filePrefix` | `prefix` |
| `schemas-inline`, `schemas-single-use` | `structuralMethods`, `allowZodScalars` | `structural`, `scalars` |
| `schemas-local` | `allowIn`, `allowPathPatterns`, `runtimeImportMessage` | `allow`, `patterns`, `importMessage` |
| `tests-assertions` | `additionalTestFunctions`, `additionalAssertionFunctions` | `functions`, `assertions` |
| `tests-modifiers` | `additionalTestFunctions` | `functions` |
| `tests-titles` | `forbid` | `deny` |
| `types-declarations` | `allowPattern` | `allow` |
| `types-inline` | `functionTypes`, `minMembers` | `functions`, `min` |

### Fixed

- `comments-code` (was `no-comments`): member-comment fixes keep member tokens, separating line breaks and blank lines, skip comments a `disable-next-line` targets, and honor `jsdoc` and `allow`.
- `layout-chain` skips chains with computed links instead of reporting them forever. `layout-call-arguments` and `layout-object` fixes keep the original trailing-comma presence.
- `types-namespace-import` reports without an autofix.
- `backend-registry`: keys come from top-level objects and factory results (or the one named by `object`), string keys count, a domain without `<folder>.service.ts` is reported on the registry file, and a missing `services` folder is no longer a crash.
- `backend-sql-like`: sanitized bindings resolve by scope, a reassigned top-level binding is not trusted, and every dynamic part of a LIKE value must be sanitized.
- `boundaries-tanstack`: browser globals inside server callbacks are reported in any file; code under `<T>x` casts and non-`declare` enums or namespaces counts as runtime; global lookups no longer scale quadratically.
- `boundaries-tanstack`, `boundaries-next`, `boundaries-imports`: library identities are options with today's values as defaults (`serverPackages`, `clientPackages`, `hookPackages`, `startPackages`, `rscPackages`, `uiPackages`, `publicEnv`); subpaths of server-only and client-only packages match.
- `boundaries-imports`: `export { type X } from` counts as type-only. `boundaries-deny` and `boundaries-rpc-database` match literal computed callees (`console['log']()`), and `boundaries-rpc-database` no longer matches `db[name]()`.
- `files-externals`: subpath externals (`pg/native`) check their package; a list with spreads skips the missing-package check; a malformed nearest `package.json` skips the rule.
- `files-components-only` splits file names only on `-` and `.` again (`user_card.tsx` → `User_card`). `naming-exports` pattern mode treats an empty pattern as match-all again.
- `naming-file` takes several option objects; `unique` counts only sibling files its object's `pattern` accepts.
- `files-no-functions`, `code-object-params` and `code-trivial-functions` check `export default` function expressions; `code-object-params` checks a defaulted parameter by its type. `schemas-inline` names the namespace actually called.
- Preset: a folder's `naming.files` and `naming.unique` add to the built-in file checks instead of replacing them; invalid `naming` regexes and `layout.operations` below an app or package folder throw `PresetError`; `backend.registry` works for a root-level backend and takes `object`.
- `bun run bench` resolves plugins from the consumer's config.

## 0.11.0

- `modules/no-unknown` allows `unknown` on the narrowed parameter of a type guard (`function isAppError(error: unknown): error is AppError`) and on the error parameter of a catch callback (`catch: (error: unknown) => E`, `.catch((error: unknown) => …)`). Other uses still fail. This applies to every root.
- `arch/no-trivial-functions` no longer reports type guards with a predicate return type as pass-through wrappers. Banned names and structurally generic guards are still reported.
- Package schemas: construction is allowed only in `types/**`. Package `*.types.ts` files outside `types/` are reported again (fix: move them to `src/types/`), matching `arch/no-restricted-files`.
- Hook filenames accept a React Native platform suffix: `use-chat-draft.web.ts`, `.native.ts`, `.ios.ts` and `.android.ts`. This applies to web roots and packages.
- A UI kit outside every web root, resolved from `shadcn.ui`, gets the Tailwind checks. Its stylesheet is `tailwind.cssEntryPointsByRoot` for the kit's package folder or architecture root, otherwise the one stylesheet the web roots share. With several web stylesheets and no entry, the preset throws and names `cssEntryPointsByRoot`.

| Fix | Rules |
| --- | --- |
| Auto-fix (`--fix`) | `tailwindcss/*` sort, canonical, shorthand and whitespace rules on a kit package |
| Move | `arch/no-local-schema-construction` in package `*.types.ts` outside `types/` (to `src/types/`) |
| Reshape | `tailwindcss/no-conflicting-classes`, `tailwindcss/no-deprecated-classes` on a kit package |

## 0.10.0

**Breaking:** `packages` roots now get the app rules. Until now they only got the shared baseline (formatting, imports, stock TypeScript/JavaScript rules and `modules/import-boundaries`), so expect new errors in package `src` folders.

- A packages root with its own `package.json` is one package. Without one, each child folder is a package, so `packages: 'packages'` covers every `packages/*/src`. Per-package entries keep working. Files outside `src` keep the baseline only.
- Every package file gets the app-wide rules: `arch/no-comments` (with the stricter `*.types.ts`/`*.constants.ts` variant), the `typeSafety` set (including the `dillon-anti-slop/*` rules), `arch/no-type-declarations`, `arch/no-local-schema-construction`, `arch/no-rederive-schema`, `arch/no-module-mutable-state`, `modules/double-negation`, `arch/no-trivial-functions`, `max-lines` and `complexity`.
- Services, types and file roles in packages follow the server-root rules: `modules/service-functions`, `modules/service-types`, `modules/domain-constants`, `arch/require-object-params`, `arch/no-extra-exports`, `arch/no-inline-types`, `arch/export-file-prefix`, `arch/no-restricted-files`, `arch/no-top-level-functions`, `arch/filename-match`, `arch/filename-export-name`, `arch/folder-prefix` and `arch/no-unescaped-like`. Packages default to the `services: 'domain'` layout, and `layout` keys on a packages root now resolve inside `src`. `entry.*.ts` files stay exempt from `arch/export-file-prefix`, as in server roots.
- React code in packages (`*.tsx`, `components/**`, `hooks/**`) follows the web-root rules: the React, effects, memoization and forms policies, `arch/jsx-attributes-multiline`, `arch/no-file-level-helpers`, `arch/component-props`, `arch/declaration-name`, `modules/local-type-alias`, `modules/pascal-interface`, `arch/only-export-components` and the hook naming rules. The React plugins now load when packages exist, even without a web root.
- Package `types/**` and `*.types.ts` files may construct schemas, like backend `types/**`.
- Never on packages: `modules/backend-switch`, `modules/rpc-database`, `arch/require-orpc-output`, `modules/tanstack-runtime`, `arch/no-restricted-token`, `arch/no-runtime-in-types` and `modules/dynamic-classes`. Routes, Tailwind and shadcn usage rules stay with web roots.
- Rename `shadcn.uiImportPath` to `shadcn.ui` and `shadcn.componentImportSources` to `shadcn.components`, matching the components.json alias names. The old names throw. Migration: `shadcn: { uiImportPath: '@ui' }` becomes `shadcn: { ui: '@ui' }`.
- `shadcn.ui` also selects the UI kit files, which keep the existing kit exceptions (type safety, formatting and layout are still checked). Use a workspace package name (`'@app/ui'` → that package's `src/**`) or a tsconfig `paths` alias (`'@/kit'` → `<root>/src/kit/**`). A value that resolves to nothing throws. When unset, the kit stays `<web source>/components/ui/**`. A UI kit in a package needs `shadcn: { ui: '<package name>' }`; without it, the kit gets the full package rules.

How to fix what the new rules report:

| Fix | Rules |
| --- | --- |
| Auto-fix (`--fix`) | `arch/no-comments`, `arch/jsx-attributes-multiline`, the `react-extra/jsx-*` layout rules |
| Rename | `arch/export-file-prefix`, `arch/filename-match`, `arch/filename-export-name`, `arch/folder-prefix`, `arch/declaration-name`, `arch/export-name-pattern`, `modules/pascal-interface`, `modules/shape-suffix` |
| Move | `arch/no-type-declarations` (to `types/`), `arch/no-local-schema-construction` (to `types/` or `*.types.ts`), `arch/no-restricted-files`, `arch/no-extra-exports`, `arch/only-export-components`, `arch/no-file-level-helpers`, `modules/domain-constants`, `modules/service-types`, `modules/local-type-alias`, `max-lines` |
| Reshape | `arch/require-object-params`, `arch/component-props`, `arch/no-inline-types`, `arch/no-trivial-functions`, `arch/no-module-mutable-state`, `arch/no-restricted-constructor`, `modules/service-functions`, `modules/no-unknown`, `modules/memoization`, `typescript/no-explicit-any`, the `dillon-anti-slop/*` rules, the React and effects rules, `complexity` |

To defer a package, turn single rules off for it: `ruleExclusions: { '<rule>': ['packages/foo/**'] }`.

## 0.9.0

- Add `limits.maxTypeFileLines` (default `1000`): the preset applies this `max-lines` limit to `*.types.ts` files in app roots instead of `limits.maxFileLines`. Other files keep `maxFileLines`.

## 0.8.0

- Add `tests.mocking` to choose which test-double APIs the preset bans in test files: `'modules'` (default, unchanged) or `'strict'`, which also bans `spyOn`, `stubGlobal` and `stubEnv` outside `*.driver.test.ts` and asks for a fake driver. The object form adds `deny` API patterns and per-file `allow` exceptions.
- Add `deny`, `allow` and `checkDestructured` options to `dillon-anti-slop/no-module-mocking`. Invalid API patterns throw. Without options it reports the same calls as before.

## 0.7.0

- Update bundled plugins: `@oxlint/plugins` and `oxlint-plugin-eslint` 1.89, `oxlint-tailwindcss` 1.16, `eslint-plugin-perfectionist` 5.13, `eslint-plugin-tsdoc` 0.5.4 and `@shadcn/lint` 0.2. `@shadcn/lint` now prints a notice when a project's `cn` is older than 0.4 and lints with its bundled `cn` instead.
- Add a `framework` setting per web root (`tanstack-start` by default, or `next` for the App Router) and a top-level default. Add the generic `reactModulesPreset` and `nextReactModulesPreset`; `tanstackStartReactModulesPreset` equals `reactModulesPreset` with the default framework; apart from the `.illustration.tsx` role below, it keeps its previous output.
- For `next` roots, apply App Router route policies to pages, layouts and `route.ts` handlers, default Tailwind to `src/app/globals.css`, and ignore `.next/**` and `next-env.d.ts`. Monorepos can mix TanStack Start and Next web roots in one config.
- Add `modules/next-runtime`: server/client ownership for Next services and lib from file names (`.server`, `.rsc`, `.action`, `.client`) and `'use server'`/`'use client'` directives. Client hooks are rejected in server, RSC and shared modules, named or through a `React` namespace, and `globalThis.window`-style access counts as a bare global. Options: `next.additionalServerOnlyImports`, `next.additionalClientOnlyImports` and `next.computedImportAllowedFiles`.
- Add `allowedExports` and `inspectExports` to `arch/route-surface`. Defaults keep today's behavior.
- Next `route.ts` handlers may export HTTP methods and route segment config such as `generateStaticParams`, also through aliases like `export { handler as GET }`, without `no-file-level-helpers` reporting them. Page-only exports such as `metadata` stay rejected there. Next service roots accept `.action.ts` files.
- Add the `.illustration.tsx` component role for artwork: the shadcn rules allow arbitrary colour, shadow, gradient, background, mask, blur, fill and stroke values there, while type size, tracking, leading, radius and spacing stay on the theme scale. Component contracts and the `components/ui` exemption still apply. `only-export-components` accepts `trailingRoles` so `foo-bar.illustration.tsx` may export `FooBar` as well as the existing `FooBarIllustration`.
- When the architecture has no backend root, Next web `types/` files own schemas: Zod construction is allowed there and `no-runtime-in-types` does not apply. TanStack Start roots and configurations with a backend keep their previous schema policy.
- Add `sourceDir` to web, server and runner architecture entries for code outside `src`, such as a Next app with `app/` at the root (`sourceDir: '.'`). Defaults to `src`.
- Add `formatting: { semi, quotes }` to choose semicolons (`always` or `never`) and quote style (`single` or `double`). Defaults keep today's style.
- Add `ruleSeverities` to set single preset rules to `error`, `warn` or `off` after the global `severity` and policy callbacks. Rules from Oxlint categories, such as `no-debugger`, are set at the top level.
- Add `modules.colocatedTypeFiles` to allow listed type files outside `types/`; they follow the backend `types/` contract.

## 0.6.3

- Add a trailing comma when `object-multiline` splits an object, so the fix agrees with multiline comma rules.

- Add opt-in `ternary-layout` and `call-arguments-multiline` layout rules with configurable thresholds and indentation. Presets remain unchanged.

## 0.6.2

- Export `oxlint-plugin-arch/rules/dillon-anti-slop` and `oxlint-plugin-arch/rules/module-policy` with TypeScript declarations. Resolve the preset's three first-party plugins through public package entry points, without changing rules or policy. Document standalone registration and third-party dependency ownership; verify built exports expose every supporting rule.

## 0.6.1

- Relax the preset's shadcn defaults for stock composition, so strict consumers need no overrides: exact padding groups on `CardContent`/`PopoverContent`, gap and padding on `TabsContent`, and gap on `Tabs`/`HoverCardContent`/`SidebarHeader`/`BreadcrumbList`; exact `truncate` everywhere. Controls such as `Button` stay protected.
- Allow safe-area padding values (`env(safe-area-inset-*)` and `max(--spacing(*),env(safe-area-inset-*))` on padding sides/axes) in `shadcn/no-arbitrary-values`. Literal floors such as `max(1rem,…)` stay rejected.
- Allow the stock Sonner hooks `toaster` and `toast` only in each web root's `components/ui/sonner.tsx`. No new preset options.

## 0.6.0

- Add `tests.profile` (`fixtures` by default, or `standard`), explicit custom test/assertion names, parameterized-test recognition and assertion-based narrowing guidance. Both profiles retain assertion, mock and type-safety checks; fixtures additionally require named fixture/support imports.
- Add explicit `modules.migrationFiles` scopes to exempt framework migration functions from service function/signature and folder-layout conventions without globally ignoring their safety checks.
- Recognize `test.for` titles and configured custom test modifiers; cover profiles and migration isolation with real Oxlint CLI regressions.
- Replace the preset’s native assertion-presence/placement checks with `modules/test-assertions`, covering native and extended tests, called local helpers and static table-row assertion callbacks. Require an assertion in every row; retain errors for standalone assertions, unused helpers and shadowed expectations. Custom assertion DSLs use `tests.additionalAssertionFunctions` or scoped module-rule options.
- Recognize polling/soft assertions without mistaking table builders or asymmetric matchers for assertions. Verify Tailwind fixes converge by file contents rather than assuming exit zero means an unchanged next pass.
- Add `arch/component-props`: every React component with props, exported or local, uses `interface XProps` declared directly above it; inline props always fail. Pass-through components may take a plain `ComponentProps<'tag'>` or `ComponentProps<typeof X>`. `filePrefix` requires local components to carry the file prefix. Enabled in the preset (with `filePrefix`) for `components/**/*.tsx`, excluding `components/ui` and tests; hooks, routes and non-component functions are unaffected. Opt out with `react: { componentProps: false }`, which leaves the other type-placement rules on.

## 0.5.0

- Replace the preset's `eslint-plugin-better-tailwindcss` dependency with `oxlint-tailwindcss` 1.14.0. Preserve seven Tailwind checks, per-root CSS themes and root font size, with shadcn retaining unknown-class and component checks. Consumer rule overrides must use the new `tailwindcss/*` IDs documented in the README. Add real autofix/idempotence coverage; deprecated classes now belong to the dedicated deprecation diagnostic.

- Breaking unreleased preset API cleanup: grouped limits, modules, imports, oRPC, SQL, forms, React and TanStack Start settings; all boolean/callback policies now live under `policies`. Use `severity`, `cliFiles` and `ruleExclusions`; Tailwind/shadcn leaves use explicit names. Old flat preset keys are removed. Rule behavior, defaults, callback order and standalone rule APIs are unchanged.

- Configure per-root folder layouts through role/object architecture entries; keep shorthand defaults, exact flat/domain structure, hook/component naming and layout-derived RPC ownership.
- Permit strictly named public method-only frontend service objects without changing factory-returned APIs; check their trivial wrappers and parameter contracts.
- Add TanStack runtime boundary checks with scoped imported factory recognition, an RPC-owner server-branch exception, direct dependency/global checks and exact-file computed-import customization.
- Expose the existing max-lines ceiling as maxLines (default 400); improve helper, constants, namespace, alias, filename and portable-contract diagnostics with exact-message regressions.

- Web runtime service entries support cohesive public operations with domain-prefixed nested helpers and no private module-level functions. Explicit actions/queries and backend service rules remain strict. Web module data moves to domain-prefixed constants files; real service instances keep their lifetimes.

- Enable `arch/prefer-namespace-type-import` at `max: 3` in the preset imports policy. Add CLI threshold, namespace acceptance, qualified-reference autofix/idempotence, TypeScript and consumer-option regressions plus rule-coverage fixtures.

- Keep every configured frontend library portable: reject app service/API dependencies and foreign domain types, allowing only type-only consumption of a same-root, same-stem contract. Reject app-type re-exports; normalize optional utility stems and resolve relative/configured aliases. Keep backend scopes and existing consumer exceptions intact, with CLI regressions for multiple web roots and domain utilities.

- Replace the unreleased preset's fixed architecture slots with normalized path-to-role mappings supporting multiple apps per role and rejecting overlapping roots. Add explicitly declared concept file roles with full domain-role function prefixes and same-app domain boundaries; public service/utils surfaces reject private re-exports. Retain scope-resolved returned-method support for standalone consumers; backend factories remain strict.

- Enable precise trivial-function detection in the preset: configurable helper names, renamed generic guards and unchanged-argument wrappers; preserve legacy defaults and meaningful transformations.
- Require domain prefixes for private utility/action/query functions with `allFunctions`; keep exact filename matching for exported operations and strict service helper boundaries.

- Allow meaningful imported generic type instantiations; add opt-in camel-case filename placeholders and enable them for preset action/query names.

- Allow standard caller opacity utilities in the preset's shadcn policy; retain bans on other appearance overrides and arbitrary opacity, verified with a real CLI fixture.

- Allow private nested helpers only in action/query operations, require exactly one named function export there, and reject additional type/value/re-exports. Keep module-level helpers and other service scopes strict. Add configurable guidance explaining that `.utils.ts` is reserved for genuinely shared helpers.

- Disable render-time function/object/array/JSX prop bans for React Compiler projects; keep them when `reactCompiler: false`. Allow frontend service constants while retaining backend separation under configurable architecture roots. Keep portable-type and intentional-wrapper exceptions consumer-owned and file-specific.

- Restore missing type-file/helper restrictions and close utility-type, prompt-comment and UI-kit safety/formatting exceptions. Type and constant files reject ordinary and SAFETY comments; constants cannot hide functions.
- Enable unbound-method, catch-callback typing, noninteractive-tabindex and render-time object/function prop checks. Require typed mocks, enforce file-size/complexity limits in tests, and restrict all console methods to configured scripts/CLI or explicit adapter exceptions.
- Compare Crauler's enabled rules, disabled rules, exclusions and options against the baseline; retain its route-handler helper restriction without copying product-specific ignores. Add scope regressions and retain passing/failing fixtures for every enabled preset rule.

- Cover all 475 enabled preset rules, including implicit Oxlint defaults, with positive and negative CLI fixtures. Compare the manifest to resolved configuration and verify fixture discovery so newly enabled rules cannot silently lack coverage.
- Recognize SAFETY comments immediately above exported assertions without allowing comments to leak across statement boundaries.

- Add checked-in valid, invalid and customized preset mini-projects with real CLI diagnostics and a TypeScript-clean baseline. Fix public-entry export naming, domain type filename scopes, intrinsic JSX dynamic classes and TypeScript package import resolution.
- Add opt-in `multilineVariables` padding and `operatorMethods` SQL sanitizer checks without changing either rule's existing defaults. The preset enables both.

- Keep preset entry points under `src/presets`, explicit configuration groups under `src/configs`, and named contracts under `src/types`. Separate plugin loading, architecture resolution and policy composition; remove runtime rule-name classification and nested preset helpers.

- Keep Dillon Mulroy's vendored rules under `src/rules/dillon-anti-slop`, using the `dillon-anti-slop/*` namespace, with upstream attribution and the original MIT license included in the package.

- Verify standalone frontend paths, custom import-alias boundaries, exported Props interfaces, public endpoint scopes and policy switches in preset mini projects. Promote native correctness defaults without repeating their rule entries.

- Add the typed `tanstack-start-react-modules-preset` export with configurable architecture roots, error/warn level, boolean/callback policies, rule-specific exclusions and native Oxlint composition. Include React, effects, Tailwind/shadcn, formatting, module boundaries and supporting safety rules; verify behavior with CLI mini projects. The preset requires Oxlint 1.85+ and its type-aware engine.

- Add `prefer-namespace-type-import` with a configurable named-type-import limit (default 3), module-specific namespace names, and scope-aware autofixes that qualify type references while reporting unsafe rewrites without a fix.

- Options that took one regex string now also take a non-empty list, where any pattern may match: `pattern`, `allowPattern`, `allowNamePattern`, `denyTypePattern`, `hookPattern`, `rootPattern`, `factoryPattern`, `forbid`, and `require`. Single strings keep their behavior.
- `no-type-declarations` `allowPattern` entries starting with `=` or `^=` match a type alias's value (`= ` plus its source text) instead of its name, so `'^= ReturnType<typeof '` keeps factory return types next to their factory. A name pattern that starts with `=` or `^=` is now read as a value pattern.
- Fix `declaration-name` `pattern` with `g` or `y` flags rejecting every name after the first match.

## 0.3.3

Version 0.3.2 was tagged but never published to npm; 0.3.3 contains its fixes.

- Fix `chain-newline` reporting chains that already have one call per line when the root is parenthesized (`(db as TestDb)\n  .insertInto()`), the root spans several lines, or a comment sits between two links.
- Autofix `call-array-multiline` arrays with parenthesized elements, like `Promise.all([(a), (b)])`.

## 0.3.1

- Fix `key-value-same-line` reporting `key: (` values whose parenthesized expression starts on the next line.

## 0.3.0

- Add `no-promise-all-mutation`, `no-literal-in`, and `test-title-pattern` to replace hand-written `no-restricted-syntax` selectors with scope-aware, configurable rules.
- Add `no-module-mutable-state`, `no-restricted-constructor`, and `no-comments` (directives, bundler annotations, and `Why:` comments kept; one-pass autofix that skips JSX comments and directive-adjacent lines).
- Add layout rules `padding-between-statements`, `object-multiline`, `key-value-same-line`, `chain-newline`, `call-array-multiline`, and `jsx-attributes-multiline`. Fixes only change whitespace and are skipped when comments or unusual syntax make them unsafe.
- Extend `no-extra-exports` with regex `patterns`, `no-restricted-token` with multiple `restrictions` and `member` matching, and `require-paired-call` with `pairs`.
- Extend `require-object-params` with `maxParams`, `allDeclarations`, and `allowPattern`; `only-export-components` with `allowTypeExports` and `denyTypePattern`; and `no-extra-factory-keys` with `requireKeys` and `keySets`.
- Extend `no-runtime-in-types` with opt-in `runtimeImports`, `allowImportSources`, and `banReExports`; `no-trivial-functions` with `allowCallees` and `allowAsync`; and `no-inline-types` with `minMembers`.
- All option changes are backward compatible; existing configs keep today's behavior.
- Speed up `declaration-name`, `no-type-declarations`, `no-inline-types`, and `no-promise-all-mutation` by using native visitors and per-file option setup instead of whole-AST JavaScript walks.
- Add `examples/monorepo.oxlint.config.ts`, a strict copy-ready config for `apps/server` + `apps/web` monorepos.
- Remove the `install-oxlint-arch` agent skill and vendored copy; install the npm package instead.

## 0.2.5

- Add `no-inline-types` to require named object and function types in function signatures, with separate parameter, return, and function-type options.
- Add `only-export-constants` to restrict exports to local `const` bindings, with opt-ins for function values, type exports, and re-exports.
- Add `no-member-comments` to remove comments on object/type members while preserving directives and optional `Why:` explanations.
- Document the new rule options and syntax-only limits, extend the full configuration example to all 30 rules, and sync the optional vendored skill assets.

## 0.2.4

- Add `trailingRoles` and `roleSeparators` so `export-file-prefix`, `declaration-name`, and `no-extra-exports` can treat `onchain-utils.ts` like `onchain.utils.ts`.

## 0.2.3

- Add `declaration-name` so selected declarations can follow a file prefix or pattern per glob.
- Add `export-file-prefix` `singularize` so plural filenames accept singular prefixes.
- Add `no-type-declarations` to keep type aliases and interfaces out of matched files.

## 0.2.2

- Publish compiled `dist/index.js` so Oxlint can load the package from `node_modules`.

## 0.2.1

- First npm tarball. Raw TypeScript entry could not load from `node_modules`.

## 0.2.0

First npm release.

- Add `no-trivial-functions`, `no-local-schema-construction`, and `no-single-use-scalar-schema`.
- Add `folder-prefix` `after` so nested folders stay in the filename.
- Add `allDeclarations` on filename/export naming rules.
- Close alias, type-only import, re-export, and `zod/*` edge cases.
- Install from npm with specifier `oxlint-plugin-arch`. Vendoring stays optional.

## 0.1.0

Initial plugin with configurable architecture rules.
