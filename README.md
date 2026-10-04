# 🏛️ oxlint-plugin-arch

> Architecture rules for [Oxlint](https://oxc.rs), driven by filenames and fully configurable.

Keep a codebase shaped the way you designed it: files in the right folders, exports named after their file, types where they belong, and no shortcuts across boundaries. Every rule is generic, so **you** decide the paths, names, and policy in your own Oxlint config.

- 🗂️ **Filename-aware.** Rules derive expected names from the file they run on (`user-action.create.ts` → `makeUserActionCreate`).
- 🎛️ **Configurable.** No app names, folders, or libraries are baked in. Globs and policy live in your config.
- 🛟 **Safe autofix.** Layout and comment rules only touch whitespace or comments. Type-import fixes qualify scope-resolved references and skip unsafe rewrites.
- ⚡ **Fast.** Built on Oxlint's JS plugin API and ESTree, with no extra parser.

---

## TanStack Start React modules preset

The optional **`tanstack-start-react-modules-preset`** supplies an opinionated application policy. The individual `arch` rules remain generic; importing the plugin alone does not enable the preset.

```sh
bun add -d oxlint oxlint-tsgolint oxlint-plugin-arch
```

In your root `oxlint.config.ts`:

```ts
import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({ root: import.meta.dirname });
```

The equivalent named import is `tanstackStartReactModulesPreset` from `oxlint-plugin-arch/presets`. Both return a normal `OxlintConfig` object. The preset ships its JS-plugin dependencies and resolves them from its own package, including React, effects, Tailwind, shadcn, import ordering, formatting and type-safety rules. Type-aware linting is enabled; install `oxlint-tsgolint` and provide a tsconfig for the files you lint. Oxlint 1.85 or newer is required.

### Architecture

Paths are relative **app roots**, not `src` directories. These are the defaults:

```ts
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

`architecture` maps paths to roles and replaces the defaults when supplied. Multiple apps may share a role: `{ 'apps/dashboard': 'web', 'apps/storefront': 'web', 'apps/api': 'server', packages: 'packages', scripts: 'scripts' }`. Use `runner` for another strict backend, or `{ '.': 'web' }` for a standalone frontend. Omit absent roots. Paths are normalized; duplicates, overlapping roots and paths outside the project are rejected. Web and backend roles derive `src/services`, `src/types` and other application scopes; packages have no assumed app layout, and scripts permit console output. Shared baseline policies still apply everywhere. Each web root defaults to its own `src/application/styles.css`. Set `tailwind.entryPoints: { 'apps/storefront': 'themes/store.css' }` for per-root paths, or `tailwind.entryPoint` for an explicitly shared stylesheet. Entry paths are relative to `root`; `tailwind: false` disables Tailwind. Per-root CSS is supplied through Tailwind rule options because Oxlint 1.85 has no override-level `settings`. Shadcn discovers each app's theme through its own `components.json` (or package-local discovery). `root` makes asset and package resolution independent of the lint command's working directory; invoke the root config from its real filesystem location.

Folder layout is independent of role/content rules. Shorthand roles use defaults: web has domain services and flat hooks; server/runner have domain services. Other folders keep their existing role conventions unless explicitly configured. Object entries merge folder choices into those defaults:

```ts
architecture: {
  'apps/dashboard': { role: 'web', layout: { services: 'flat', hooks: 'domain', features: 'domain' } },
  'apps/storefront': { role: 'web', layout: { services: 'domain', features: 'flat' } },
  'apps/api': { role: 'server', layout: { services: 'domain' } },
}
```

Folder keys are literal paths relative to an app's `src` (relative to the root for packages/scripts), not new architecture slots. Segments use letters, numbers, underscores and hyphens; absolute paths, escapes, globs, empty segments and overlapping configured/default folders are rejected. `flat` requires source files directly in that folder. `domain` requires exactly one directory and filename ownership by that directory; loose/deeper files cannot coexist. Checks cover TS/TSX/MTS/CTS source files, not asset directory trees. Generic domain filenames start with their owning directory plus a dot/hyphen; hooks retain `use-` and components retain their existing singular-name convention. Choosing layout never disables service exports, types, constants, runtime suffixes or anti-slop. Existing policy callbacks and native overrides remain available.

RPC ownership follows each web root's service layout: `services/rpc.client.ts` for flat, `services/rpc/rpc.client.ts` for domain. `rpcClient` remains the explicit consumer override. There is no mixed-layout mode.

### Configure policies

Each policy accepts `true` (default configuration), `false` (disabled), or a callback receiving fresh native Oxlint override objects. Callbacks run before the overall severity is applied. They never mutate another preset invocation.

```ts
export default preset({
  root: import.meta.dirname,
  level: 'warn',
  complexity: 24,
  banTypes: (current) => current.map((scope) => ({
    ...scope,
    excludeFiles: [...(scope.excludeFiles ?? []), '**/portable/**'],
  })),
});
```

Use `banTypes: false` to disable type **location** restrictions, or `banTypes: true` to retain them. Other policies such as `typeSafety` continue to reject explicit `any`/`unknown`. To extend rather than modify a policy, append an override with its own `files` and `rules`:

```ts
export default preset({
  banTypes: (current) => [
    ...current,
    {
      files: ['tools/**/*.ts'],
      rules: { 'arch/no-type-declarations': 'error' },
    },
  ],
});
```

Available policies: `banTypes`, `typeSafety`, `serviceModules`, `moduleLayout`, `naming`, `comments`, `formatting`, `layout`, `imports`, `reactRules`, `effects`, `memoization`, `routes`, `forms`, `schemas`, `boundaries`, `tests`, `wrappers`, `mutableState`, `backendRules`, `clientOwnership`, `tailwindRules`, and `shadcnRules`.

Shadcn allows caller-owned layout and standard opacity utilities. Other appearance belongs in the component API; arbitrary opacity still fails token validation. Add product-specific component contracts through `shadcnRules` or native Oxlint overrides, keeping `layout` and `opacity` in any replacement allowance.

`level` is `error` by default and can be `warn`. Deliberately disabled rules remain disabled. `complexity` defaults to 32. React Compiler is assumed by default: manual memoization is banned and the four React performance rules against render-time function/object/array/JSX props are off. `reactCompiler: false` allows manual memoization and enables those four rules. `shadcn: false` disables shadcn integration while retaining Tailwind checks. `tailwind` accepts `entryPoint`, `entryPoints` and `rootFontSize`; `shadcn` accepts `ui` and `componentImports`. UI-kit files remain linted, with architecture/appearance exceptions rather than a global ignore.

Module configuration, lookup tables, limits and defaults belong in domain `.constants.ts` files, including frontend services. All frontend constant declarations carry the domain prefix (for example `BOT_MODEL_PRIORITY`). Frontend service scopes enable `modules/domain-constants` with `includeData: true`: it detects module-level literal/object/array data, literal calculations and seeded Map/Set tables, plus the existing uppercase constants. Function-local calculations and call-created service instances remain in their owner; empty Map/Set state is not classified as configuration. This is syntactic enforcement, not semantic data-flow analysis: imported aliases and arbitrary call-created configuration still need review. Backend rule defaults are unchanged. Every scope follows the configured architecture roots; a web `.server.ts` file remains frontend-owned.

### Exceptions and native customization

Action/query files (`services/**/*-{action,query}.*.ts` under configured app roots) export exactly one named operation. Helpers used only by that operation may be private nested functions or arrows inside it. Extra exports, including types, constants and re-exports, fail. Module-level private helpers still fail. Backend service files retain the stricter helper policy; `.utils.ts` files are for genuinely shared domain helpers, not a destination for every extraction. The trivial-function rule still applies.

Frontend `.client.ts`, `.server.ts` and `.rsc.{ts,tsx}` service entries are cohesive modules: multiple public domain-prefixed operations are allowed. No private module-level function satellites are allowed. Operation-only helpers stay nested inside their public operation and retain the domain prefix; genuinely shared helpers belong in domain `.utils.ts`. Factories are optional for real state, injection or lifetimes, and existing singleton exports remain valid. Do not export helpers just to evade this rule. Runtime suffix checks, React-free client checks and anti-slop rules remain enabled. A direct `export const themeService = { themeApply(...) { ... } }` is also allowed: a nonempty method-only object, static identifier keys, both binding and methods domain-prefixed. Data fields, getters/setters, strings/computed keys, spreads, arrow properties and callback-reference tables do not qualify. Returned factory API keys retain their existing contract. `allowServiceMethods` on domain-constants, `serviceMethods` on naming/object-parameter rules and `checkServiceMethods` on no-trivial-functions are enabled only for frontend runtime scopes; backend defaults remain unchanged. Object methods receive wrapper/generic-guard checks and named-parameter-contract rules. This is a syntax form, not proof that an object owns meaningful state.

Frontend actions/queries retain their runtime suffix: `theme-action.apply.client.ts` exports exactly `themeActionApply`, not `themeActionApplyClient`. Related helpers stay inside that operation. Backend operations remain `domain-action.name.ts` / `domain-query.name.ts`, without runtime suffixes.

Shared frontend domain helpers use `<domain>.utils.ts` in the configured services layout. Domain mode groups all runtime, utility, constants and action/query files under `services/<domain>/`; flat mode keeps all directly under `services/`. Utility functions, including private helpers, keep their domain prefix. Pure implementation does not make an application-specific helper portable: the preset enables `portableLib` in `modules/import-boundaries` for every configured web root. Files under `src/lib/` cannot import or re-export any configured app's services or app package APIs, including otherwise public backend entrypoints and type-only references. Backend library scopes retain their existing rules.

A portable module may consume its own contract using a type-only import from exactly the same web root's `types/<module>.types.ts`. The module stem removes the source extension and optional `.utils` suffix: both `lib/fade.ts` and `lib/fade.utils.ts` may consume `types/fade.types.ts`. Value imports, other-domain types, same-stem types from another app, and app-type re-exports (including imported bindings subsequently exported) fail. Relative paths, the built-in `@/` alias and configured aliases use the same ownership check. This is a filename ownership convention, not transitive semantic portability proof: the rule does not inspect imported contracts or follow module graphs. Static imports/re-exports, literal dynamic imports and TypeScript import types are checked; computed imports and arbitrary alias/data flow are not resolved. Custom aliases must be configured explicitly. An own-type match never overrides a services/backend/API ban.

The supporting rule's `portableLib` option defaults to `false` outside the preset for compatibility. Use the existing `boundaries` callback, native overrides or file-specific `exclude['modules/import-boundaries']` for explicit consumer exceptions; an exclusion skips that rule's entire boundary check for the named file, so keep it narrow and documented.

The preset's imports policy enables `arch/prefer-namespace-type-import` with `{ max: 3 }` for checked TypeScript files. Up to three named type imports stay named; four or more become a type namespace (for example, `BotTypes` from `bot.types`) with qualified references. The scope-aware autofix preserves aliases and rewrites only supported type references. Imports with namespace collisions, inline comments, local re-exports or unsupported reference syntax remain reported for manual review. Domain exports keep their names. Customize `max` or the rule's source-to-namespace `names` map through the existing `imports` callback or a native override; file-specific exclusions remain available.

Declare cohesive private concept roles with `fileRoles: ['prompts']`. Built-in roles (`service`, `client`, `server`, `rsc`, `utils`, `action`, `query`, `types`, `constants`, `handler`, `test`, `spec`) cannot be redefined. A `route.prompts.ts` file may contain multiple builders, but every named function, including private functions, starts with the full `routePrompts` prefix. Arbitrary suffixes grant no exemption. Anti-slop checks remain enabled and comment exceptions remain explicit.

With declared file roles, private service-domain files can be imported or re-exported only within their owning domain in the same app root. Cross-domain callers use service APIs (`.service`, `.client`, `.server`, `.rsc`) or genuinely shared `.utils`, types or constants. Public service/utility surfaces cannot re-export private internals, including private barrels; this checks export-from, export-star and directly imported bindings exported by name or namespace. Operations may use private concepts internally. This is a per-file surface contract, not a transitive module graph or arbitrary data-flow/alias analysis; do not move concept logic into utilities to evade ownership.

`modules/service-functions` accepts `frontend`, `allowLocalHelpers`, `allowReturnedMethods`, `singleExport`, and `message` through the `serviceModules` callback or native overrides. The booleans default to `false` outside the preset's scoped overrides. `frontend: true` permits multiple public operations and their nested helpers; `singleExport: true` still requires exactly one operation. The preset enables frontend mode only for web runtime entries and applies the stricter single-export override to explicit actions/queries. The preset's diagnostic explains where helpers belong; consumers can replace `message` without disabling the rule.

`exclude` disables only the named rule in the selected files, including rules enabled through several scopes. `ignorePatterns` adds whole-file ignores to the generated/build/dependency defaults.

```ts
export default preset({
  exclude: {
    'arch/no-trivial-functions': ['apps/web/src/services/adapter.client.ts'],
    'modules/service-types': ['apps/server/src/services/portable-parser.ts'],
  },
  ignorePatterns: ['vendor/**'],
});
```

Native composition remains available; later matching overrides can change an individual rule without a policy callback:

```ts
import { defineConfig } from 'oxlint';
import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default defineConfig({
  options: { typeAware: true },
  extends: [preset({ root: import.meta.dirname })],
  overrides: [{
    files: ['scripts/**/*.ts'],
    rules: { 'unicorn/filename-case': 'off' },
  }],
});
```

Rule-specific inline disables are allowed with a reason after `--`. The preset does not force warnings to fail or define a CI/Fallow/compiler workflow.

Oxlint reads `typeAware` from the root config only. The direct `export default preset(...)` form already sets it; when using `extends`, keep the explicit root option shown above.

### Application conventions

- Single quotes, semicolons, two spaces, braced multiline control flow, early returns, 160-character lines and 400-line app and test files. Promise arrays and call objects expand; method chains are not forced multiline.
- Components live in one group folder with matching prefixed names. Hooks default to flat `use-*.ts` files; an explicit domain layout retains the hook filename convention. Local React types are prefixed interfaces; exported Props interfaces are allowed. Other types belong in domain `types/*.types.ts` files.
- Backend operations use `domain-action.name.ts` / `domain-query.name.ts`. Services allow one domain folder, one exported operation without private helpers, object parameters and named signature types. Explicit `.utils.ts` files can hold generic helpers, but their types still belong in domain type files. Domain type and constant files cannot contain top-level functions. Frontend services use `.client.ts`, `.server.ts` or `.rsc.{ts,tsx}`. RSC JSX entries retain `domainRscName` exports and the same helper/constants policies.
- Routes wire components, forms use a schema resolver, context creation has an owner directory, and effects cannot replace derived values or event handlers. React Compiler projects reject manual memoization. Test IDs are allowed. JSX rejects new object/function props inside render, and noninteractive elements cannot receive a tab index.
- Safety rules reject unknown/any, chained assertions, unjustified assertions, loose dictionaries, module mocks, shared mutable bindings and focused/skipped/placeholder tests. Comments are limited to supported directives, SAFETY notes and explicit exceptions. Type/constant files do not allow SAFETY comments; prompt files require explicit comment exceptions. UI-kit code retains type-safety, formatting and layout checks.
- Unbound methods and untyped mocks are rejected, including in tests. Console calls require an explicit script/CLI scope or adapter exclusion. Promise rejection callbacks must not receive implicit `any`; omitting the error parameter is allowed. App code needing an `unknown` boundary must use an explicit rule-specific exception.
- Backend owns shared schemas and exposes a public client entry point; frontend type files are runtime-free. Packages cannot import app internals, RPC handlers delegate database work, and service dependencies are injected.

Provide `publicApi: ['apps/server/src/rpc/api/**/*.ts']` for externally exposed oRPC endpoints requiring output schemas; exposure cannot be inferred from filenames or authentication. `publicEntrypoints` defaults to `<backend package name>/client` read from each configured backend manifest. Configure it for another public API. Other targeted settings are `rpcClient`, `formResolver`, `schemaComposers`, `sanitizers`, `internalPatterns`, and `cli` (explicit console/CLI exceptions).

For custom import aliases, supply `aliases: { '@backend': 'apps/server/src' }`. Keys are import prefixes without wildcards, and values are directories relative to `root`. Boundary checks then treat `@backend/services/chat.service` like its relative path. `internalPatterns` controls import sorting only.

Native correctness defaults are promoted through `categories.correctness`; redundant rule entries are omitted after checking Oxlint's resolved configuration. Framework policies add the opinionated options on top. Other future presets can have their own named subpath under `/presets`; this factory does not enable any other preset.

The preset has [paired CLI fixtures for every enabled rule](tests/fixtures/tanstack-start-react-modules/README.md), including Oxlint defaults, plus architecture and consumer-override scenarios. The coverage guard detects newly enabled rules without fixtures.

The preset's supporting `modules/*` rules keep independent policies from overwriting one another: service type/factory matching, helper restrictions, import boundaries, reasoned lint directives, Shape-suffix names, empty effects, memoization and test modifiers. Dillon Mulroy's vendored [anti-slop rules](https://github.com/dmmulroy/anti-slop) live in `src/rules/dillon-anti-slop` and use the `dillon-anti-slop/*` namespace. They ship in this package; consumers do not need local plugin files. These supporting plugins are loaded by the preset, not registered by the generic plugin entry point.

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

## 🚀 Quick start

Rules are switched on per folder with `overrides`. Here are three small ones:

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

## 📚 Examples

| File | Use it when |
| --- | --- |
| [`minimal.oxlint.config.ts`](examples/minimal.oxlint.config.ts) | You want the smallest possible starting point. |
| [`monorepo.oxlint.config.ts`](examples/monorepo.oxlint.config.ts) | ⭐ You are starting an `apps/server` + `apps/web` monorepo and want a strict, copy-ready setup. |
| [`full.oxlint.config.ts`](examples/full.oxlint.config.ts) | You want to see every one of the 43 rules with its options. |

> [!TIP]
> `monorepo.oxlint.config.ts` already loads `oxlint-plugin-arch`, so you can copy it as-is and adjust globs and names. The other two load `../src/index.ts`; change that specifier to `oxlint-plugin-arch` when you copy them.

---

## 🧩 Rules

43 rules in 9 groups. 🔧 means the rule can autofix. Each rule file in [`src/rules/`](src/rules) explains its behavior in plain English, and the tests in [`src/tests/`](src/tests) show every option shape.

Options that take one regex string (`pattern`, `allowPattern`, `forbid`, `require`, and the other `*Pattern` options) also take a non-empty list; any pattern in the list may match. Options that were already lists, such as `allowPatterns` and `allowCallees`, are unchanged.

### 📁 Files & folders

| Rule | What it enforces |
| --- | --- |
| `filename-match` | Filenames match a pattern you configure. |
| `folder-prefix` | Filenames start with their parent folder name, or the folders after a root you choose. |
| `no-restricted-files` | Files matching a glob you forbid are reported, for example misplaced `*.types.ts`. |

### 🏷️ Naming & exports

| Rule | What it enforces |
| --- | --- |
| `declaration-name` | Selected declarations start with a prefix taken from the filename, or match a pattern. |
| `export-file-prefix` | Names start with the filename prefix. `allFunctions` includes private functions; `allDeclarations` includes every declaration. `trailingRoles` handles role suffixes. |
| `export-name-pattern` | Export names (or every function and type) match a regular expression. |
| `filename-export-name` | Function names follow a template built from the filename. Set `camelCase: true` to convert lowercase placeholders such as `{domain}` from `user-profile` to `userProfile`; the default preserves captured text. |
| `no-extra-exports` | A file exports only the names you allow. `patterns` accepts families such as `{Domain}[A-Z]\w*`. |
| `only-export-constants` | Constant files export only local `const` values. [Details ↓](#only-export-constants) |

### 🏭 Functions & factories

| Rule | What it enforces |
| --- | --- |
| `require-file-factory` | The file defines the factory function its filename promises. |
| `no-extra-factory-keys` | A factory returns only allowed keys. `requireKeys` makes keys mandatory; `keySets` sets keys per factory pattern. |
| `require-object-params` | Functions take object parameters instead of long positional lists. `maxParams: 2` allows `(deps, params)`. |
| `no-file-level-helpers` | No stray helper functions at module scope. |
| `no-top-level-functions` | No top-level functions (and optionally no re-exports) in matched files. |
| `no-trivial-functions` | No empty/pass-through functions. `mode: 'precise'` preserves transformations and checks forbidden helper names and renamed generic guards. |
| `no-module-mutable-state` | No module-level `let`/`var`, which is shared across requests and tests. |

### 🔷 Types

| Rule | What it enforces |
| --- | --- |
| `no-inline-types` | Function signatures use named types instead of inline `{ ... }` objects. [Details ↓](#no-inline-types) |
| `no-type-declarations` | No type aliases or interfaces in matched files, so types live in one place. |
| `no-runtime-in-types` | Type modules stay free of runtime code. Opt in to also ban runtime imports and re-exports. |
| `no-imported-type-alias` | No exported aliases that only rename an imported type; generic instantiations such as `Selectable<Table>` remain allowed. |
| `prefer-namespace-type-import` 🔧 | Long type-only named imports become a namespace import with qualified references. [Details ↓](#prefer-namespace-type-import) |

### 🧪 Schemas & APIs

| Rule | What it enforces |
| --- | --- |
| `no-local-schema-construction` | No schemas built outside the files that own them. |
| `no-inline-schema-elements` | Named schemas inside combinators like `z.array(...)`. |
| `no-rederive-schema` | No re-deriving types from schemas imported from elsewhere. |
| `no-single-use-scalar-schema` | Scalar Zod aliases used once get inlined. |
| `require-orpc-output` | oRPC procedures declare a named `.output()` schema. |
| `no-unescaped-like` | `LIKE` / `ILIKE` values pass through your sanitizer; optional `operatorMethods` covers calls such as `.where(column, 'like', value)`. |

### 🚧 Boundaries & safety

| Rule | What it enforces |
| --- | --- |
| `no-restricted-token` | Identifiers or member calls appear only in owner files. `member: '*.insertInto'` keeps writes out of query files. [Details ↓](#no-restricted-token) |
| `no-restricted-constructor` | No `new Error()` (or any constructor you list) where typed errors are required. |
| `require-paired-call` | Calling one function requires calling another, for example `useForm` with a schema resolver. |
| `no-promise-all-mutation` | No `results.push(...)` or `total += x` on outer variables inside `Promise.all`. Return values instead. |
| `no-literal-in` | No `'key' in value`. Use `Object.hasOwn()` or a discriminated union. |

### ⚛️ React

| Rule | What it enforces |
| --- | --- |
| `only-export-components` | Component files export only components. `denyTypePattern: 'Props$'` keeps props private. |
| `route-surface` | Route files export the route only, with no banned hooks or raw JSX. |

### 💬 Comments & tests

| Rule | What it enforces |
| --- | --- |
| `no-comments` 🔧 | No comments in matched files. Directives, bundler annotations, and `Why:` notes are kept; JSX comments and comments next to `disable-next-line` are reported without an autofix. |
| `no-member-comments` 🔧 | No comments on interface, type, and object members. [Details ↓](#no-member-comments) |
| `test-title-pattern` | Test titles match your rules, for example no leading "should". |

### 🎨 Layout

| Rule | What it enforces |
| --- | --- |
| `padding-between-statements` 🔧 | Blank lines around functions and classes, around control flow, and before `return` in longer blocks; `multilineVariables: true` also separates multiline declarations, including exports (default `false`). |
| `object-multiline` 🔧 | Objects with 3+ properties passed to a call go one property per line (`scope: 'all'` for every object). |
| `key-value-same-line` 🔧 | An object key and the start of its value stay on the same line. |
| `chain-newline` 🔧 | Long method chains go one call per line. You pick which chains with `groups`. |
| `call-array-multiline` 🔧 | Arrays passed to `Promise.all` (or callees you list) go one element per line. |
| `jsx-attributes-multiline` 🔧 | JSX tags with 3+ attributes go one attribute per line. |

> [!WARNING]
> Oxfmt and Prettier collapse short chains, arrays, and JSX tags back onto one line. Don't run `chain-newline`, `call-array-multiline`, or `jsx-attributes-multiline` on files a formatter also rewrites, or they will undo each other forever.

---

## 🔍 Rule details

### File size

`maxLines?: number` sets the existing ESLint `max-lines` ceiling on checked safety scopes; default `400`. Blank lines and comments remain skipped. Use native Oxlint overrides or the existing `exclude` configuration for deliberate per-file exceptions. File size is a ceiling, not a cohesion proof.

### TanStack runtime boundaries

`modules/tanstack-runtime` checks every configured web root's services and lib. Server dependencies include Node builtins (bare and `node:`), Bun/Cloudflare modules, `@orpc/server`, configured backend server/RPC APIs, `.server` files, TanStack server APIs/markers and React DOM server rendering. Known RSC renderer imports are checked by symbol; the entire mixed RSC package is not banned. Pure public backend client/schema imports remain governed by existing architecture rules.

`.client.ts` is the preset's frontend-facing, potentially SSR-used service convention. Known server runtime dependencies require inline callbacks of scope-resolved imports of `createServerFn().handler`, `createServerOnlyFn`, `createMiddleware().server` or `createIsomorphicFn().server`. Alias/namespace imports are recognized; lookalike names and shadowed parameters are not. Static isomorphic server imports are allowed only in the actual configured RPC owner, and every runtime reference must stay in its server branch. Elsewhere that branch can load a literal dynamic import. Module-level execution and re-exports do not inherit the exception.

`.server` files may statically import server implementation; dynamic loading alone proves nothing. RSC permits JSX, React and server-component definitions, but server renderer/dependency references still require a server callback. Server/RSC modules reject browser globals, local hook imports, client-only markers/APIs and React/TanStack client hooks outside recognized client branches. Global checks respect lexical shadowing and direct `globalThis.name` / literal-key access. Shared utilities/constants/lib cannot launder known server or client-only imports. Type-only imports/re-exports erase at runtime but retain all architecture restrictions.

`tanstackRuntime.serverImports` and `clientImports` add package/module prefixes. `tanstackRuntime.allowComputedImportsIn` permits computed imports only in explicitly named project-relative files; review all targets before using it. Other checks still run. This is direct syntax and lexical-reference enforcement, not an import graph, interprocedural alias analysis, sandbox, or proof of SSR safety. Wrapper factories, indirect callback references, re-exported framework factories and arbitrary computed member aliases are not recognized as boundary proofs. Native rule exclusions remain explicit consumer decisions.

TanStack's [environment functions](https://tanstack.com/start/latest/docs/framework/react/guide/environment-functions) remove opposite branches, and [import protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection) checks the resulting graph. Start's default import protection treats `.client.*` as browser-only, unlike this preset's service convention: SSR consumers must deliberately configure its server file pattern (Orbs uses `server.files: []`). Keep build-side protection enabled for server dependencies; lint does not replace it.

### Private domain helpers and precise wrapper detection

The preset requires all named functions in `room.utils.ts`, exported or private, to start with `room`, such as `roomUserIsOwner`. Private action/query helpers use the same domain prefix; the exported operation must exactly match its filename (`room-action.send-message.ts` → `roomActionSendMessage`). Ordinary local variables are unaffected. Standalone `export-file-prefix` users opt in with `allFunctions: true`.

The preset enables `no-trivial-functions` with `mode: 'precise'`; standalone defaults retain legacy behavior. Precise mode rejects empty/constant/identity functions and unchanged-argument forwarding. Transformed arguments, query chains and interpolated prompts remain allowed. Nested generic runtime guards are checked too.

Default exact banned names: `isRecord`, `isPlainObject`, `isObject`, `isString`, `isNumber`, `isBoolean`, `isArray`, `asRecord`, `asArray`. `bannedNames` replaces the list; `[]` disables name checks. `checkGenericGuards: false` disables structural checks. `allowPattern` exempts named helpers; `allowCallees` and `allowAsync` exempt wrappers only. No usage-count threshold, cross-file analysis or automatic rewrite is used.

### `no-inline-types`

Requires named types in function signatures: local functions, callbacks, methods, constructors, and overloads. It checks explicit annotations only; inferred types, variable annotations, and generic constraints are left alone.

| Option | Default | What it does |
| --- | --- | --- |
| `parameters` | `true` | Check parameter annotations, including destructuring, defaults, rest, and constructor parameter properties. |
| `returns` | `true` | Check explicit return annotations. |
| `functionTypes` | `true` | Also reject inline function and constructor types. |
| `minMembers` | `1` | Allow inline object types with fewer members than this. `1` also rejects `{}`. |

Nested types count too, so `Promise<{ id: string }>` fails. An outer type is reported once, not again for each member inside it.

```ts
// ✅ Pass
function save(input: SaveInput): SaveResult { return persist(input) }

// ❌ Fail
function save(input: { id: string }): { ok: boolean } { return persist(input) }
```

<details>
<summary>More about <code>no-inline-types</code></summary>

Use `no-type-declarations` separately to control where named types may live. With `functionTypes: false`, object types nested inside function types are still checked.

</details>

### `prefer-namespace-type-import`

Prefers a namespace when a type-only import has **more than** `max` named specifiers. Both `import type { A, B }` and `import { type A, type B }` are checked; any runtime or default binding leaves the declaration alone.

| Option | Default | What it does |
| --- | --- | --- |
| `max` | `3` | Maximum named specifiers allowed (non-negative integer). Three passes; four fails. |
| `names` | `{}` | Exact module-path-to-namespace-name map, such as `{ '#/types/room.types': 'RoomTypes' }`. Values must be ASCII binding identifiers, not reserved words. |

The default name is the last path segment in PascalCase, stripping JS/TS extensions and adding `Types` unless already present: `#/types/room.types` → `RoomTypes`, `./harness.types.ts` → `HarnessTypes`, `@orbs/server/client` → `ClientTypes`. Other punctuation separates words; names starting with a digit get a `Module` prefix.

```ts
// Before
import type { A, B as LocalB, C, D } from './room.types'
export type Result = [A, LocalB, C, D]

// After
import type * as RoomTypes from './room.types'
export type Result = [RoomTypes.A, RoomTypes.B, RoomTypes.C, RoomTypes.D]
```

The autofix updates scope-resolved type references, generics, indexed access, type-position `typeof`, interface heritage, and class implementations, including TSX. Shadowed local names are untouched. Exported type declarations are updated, but local export lists (`export type { A }`, `export { type A }`, or `export { A }`) are **report-only**; direct re-exports from another module are untouched.

The diagnostic explains why an autofix was skipped: comments inside the import, an existing namespace import from the same module (no merging), a namespace name colliding with any binding/reference in the file or another proposed namespace, an unsupported imported name, or a reference outside the supported type syntax. Multiple qualifying imports from the same module are report-only too. Choose distinct `names` overrides to resolve collisions between different modules. Fixes preserve the module string, import attributes, semicolon, and comments outside the import.

### `no-type-declarations`

Rejects type aliases and interfaces in matched files, so types live in one place.

| Option | Default | What it does |
| --- | --- | --- |
| `allowPattern` | none | Keep a declaration whose **name** matches. A pattern that starts with `=` or `^=` matches a type alias's **value** instead: `= ` followed by the value's source text, without surrounding parentheses or comments. Interfaces have no value, so only name patterns apply to them. |

```ts
// allowPattern: ['(Service|Deps)$', '^= ReturnType<typeof ']
export type AiRetry = ReturnType<typeof makeAiRetry>  // ✅ value matches
export interface OrderDeps { db: Database }            // ✅ name matches
export type OrderCreateParams = { id: string }         // ❌ move it to your types file
```

### `only-export-constants`

Every runtime export must point to a local `const`. Direct, destructured, renamed, and default exports of local constants all work.

| Option | Default | What it does |
| --- | --- | --- |
| `allowFunctionValues` | `false` | Allow function-valued `const` bindings (not function declarations). |
| `allowTypeExports` | `false` | Allow type aliases, interfaces, and type-only exports. |
| `allowReExports` | `false` | Allow `export ... from`, `export *`, and exports of imported bindings. |

```ts
// ✅ Pass
const retryLimit = 3
export { retryLimit }

// ❌ Fail
export let retryCount = 0
export const retry = () => run()
```

<details>
<summary>More about <code>only-export-constants</code></summary>

`let`, `var`, function, class, enum, and namespace declarations, class-valued constants, bare default expressions, and TypeScript `export =` / `export as namespace` are rejected. Name a default value with a local `const` first.

This is a syntax rule, not a deep-immutability check. It recognizes direct function and class values, TypeScript expression wrappers, and local aliases. It does not follow values returned by calls, imports, member access, or destructuring. Objects and arrays do not need `as const` or `Object.freeze()`.

</details>

### `no-restricted-token`

Keeps identifiers and member calls inside the files that own them.

```ts
'arch/no-restricted-token': ['error', {
  restrictions: [
    { token: 'RouterClient', allowIn: ['/src/services/rpc/rpc.client.ts'] },
    { member: 'process.platform', allowIn: ['/src/runtime.ts'] },
    { member: '*.insertInto', message: 'Queries are read-only; move writes to an action.' },
  ],
}]
```

| Field | What it does |
| --- | --- |
| `token` | An identifier name to restrict. Type-only imports are ignored. |
| `member` | A dotted member path such as `process.platform`. `*.name` matches any receiver, including `this.db` and chained calls. |
| `allowIn` | Filename suffixes where the token is allowed. |
| `allowPathPatterns` | Regular expressions for allowed paths. |
| `message` | Extra guidance added to the report. |

The older single form `{ token, allowIn }` still works.

### `no-member-comments`

Removes comments on object-type members: interface properties and methods, index, call, and construct signatures, type-literal members, object literal properties, and spreads.

| Kept ✅ | Removed ❌ |
| --- | --- |
| `Why: ...` notes (with `allowWhy: true`, the default) | Other leading and same-line trailing member comments |
| Directives such as `@ts-expect-error`, `eslint-disable`, `prettier-ignore` | |

<details>
<summary>Autofix and scope details</summary>

The autofix removes the comment and any blank line after it, drops the spaces before a trailing comment, and never removes the member itself. A run of stacked comments is removed by one fix, so `--fix` finishes in one pass.

`Why:` detection checks the prefix (after whitespace or JSDoc decoration) and includes contiguous `//` continuation lines. Set `{ allowWhy: false }` to remove those too. Always-kept directives: `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-`/`oxlint-disable`/`enable`, `prettier-ignore`, `biome-ignore`, `c8`/`v8`/`istanbul ignore`, and webpack magic comments.

Out of scope: declaration, function-body, class-field, enum-member, union-member, and plain parameter comments, plus comments inside destructuring patterns and array literals. For whole-file comment policy, use `no-comments`.

</details>

---

## 🤝 Works well with anti-slop

We recommend [Dillon Mulroy's anti-slop](https://github.com/dmmulroy/anti-slop) alongside this plugin:

| Plugin | Catches |
| --- | --- |
| **anti-slop** | Low-evidence TypeScript and JavaScript patterns inside functions. |
| **oxlint-plugin-arch** | File, export, boundary, API, and layout structure. |

Register both in the same config; they use separate `anti-slop/*` and `arch/*` namespaces.

## ⚡ Benchmarks

Wall time for a full `oxlint` run over three real TypeScript monorepos, best of 5, including process startup.

| Project | Files | Lines | Plugin loaded, no rules | [Monorepo example](examples/monorepo.oxlint.config.ts) | All 42 rules on every file |
| --- | ---: | ---: | ---: | ---: | ---: |
| Small | 246 | 14.5k | 0.09s | **0.20s** | 0.23s |
| Medium | 792 | 100.5k | 0.10s | **0.49s** | 0.69s |
| Large | 1,880 | 190k | 0.10s | **0.72s** | 1.08s |

<sub>Apple M5 Pro, Oxlint 1.78.0, default thread count. Most of the gap between "no rules" and the other columns is Oxlint's one-time cost of handing the AST to JavaScript plugins, paid once however many rules are on.</sub>

## 📄 License

MIT
