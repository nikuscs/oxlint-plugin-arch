# Changelog

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
