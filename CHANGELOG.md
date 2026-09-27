# Changelog

## Unreleased

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
