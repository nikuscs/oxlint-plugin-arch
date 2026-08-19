# Changelog

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
