# Changelog

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
