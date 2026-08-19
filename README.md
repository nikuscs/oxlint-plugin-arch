# oxlint-plugin-arch

Configurable, filename-aware architecture rules for Oxlint.

Install the package, then put repository paths and policy in your Oxlint config. The npm package ships compiled JavaScript; `src/` stays TypeScript for development. Rules contain no application-specific names or folders.

## Install

```bash
bun add -d oxlint-plugin-arch oxlint @oxlint/plugins
```

Use matching `oxlint` and `@oxlint/plugins` versions. Then register the package:

```ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: 'oxlint-plugin-arch' },
  ],
})
```

## Recommended companion: anti-slop

We recommend [Dillon Mulroy's anti-slop](https://github.com/dmmulroy/anti-slop) alongside this plugin. Anti-slop catches low-evidence TypeScript and JavaScript implementation patterns; oxlint-plugin-arch enforces configurable file, export, boundary, and API structure.

Register both in the same Oxlint config under their separate `anti-slop/*` and `arch/*` rule namespaces.

## Optional: vendor a local copy

If you want to inspect or fork the rules in-tree, copy `src/index.ts`, `src/rules/`, and `src/utils/`, or use the agent skill:

```bash
npx skills add nikuscs/oxlint-plugin-arch --skill install-oxlint-arch
```

Then point `jsPlugins[].specifier` at the copied entry file instead of the package name.

## Configuration examples

- [`examples/minimal.oxlint.config.ts`](examples/minimal.oxlint.config.ts) — three small rules showing plugin registration, glob ownership, and options.
- [`examples/full.oxlint.config.ts`](examples/full.oxlint.config.ts) — all 27 rules across representative component, action, service, route, API, schema, and database scopes.

Copy the shapes that match your repository; do not copy globs or naming policy blindly.

## Rules

- `declaration-name` — require selected declarations to match a filename-derived prefix or a consumer pattern.
- `export-file-prefix` — require export names, or every function and type, to start with a filename-derived prefix, optionally singularized.
- `export-name-pattern` — require export names, or every function and type, to match a configured regular expression.
- `filename-export-name` — derive expected function names from filename templates, optionally including locals.
- `filename-match` — require filenames to match a configured pattern.
- `folder-prefix` — require filenames to start with their parent folder name, or the folders after a configured root.
- `no-extra-exports` — restrict files to configured export templates.
- `no-extra-factory-keys` — restrict direct factory return keys.
- `no-file-level-helpers` — keep unapproved helpers out of module scope.
- `no-imported-type-alias` — reject exported aliases that only rename imported types.
- `no-inline-schema-elements` — require named schemas inside configured combinators.
- `no-local-schema-construction` — reject runtime schema-library imports and local schema construction, with consumer-chosen severity, messages, and path exceptions.
- `no-rederive-schema` — reject type derivation from configured imported schemas.
- `no-restricted-files` — reject files selected by a consumer-owned forbidden glob.
- `no-restricted-token` — restrict an identifier to configured owner paths.
- `no-runtime-in-types` — keep selected type modules runtime-free.
- `no-single-use-scalar-schema` — reject local scalar Zod aliases used once where they can be safely inlined.
- `no-top-level-functions` — reject top-level functions and optional re-exports.
- `no-trivial-functions` — reject empty or passthrough top-level functions.
- `no-type-declarations` — reject type aliases and interfaces in matched files.
- `no-unescaped-like` — require configured sanitizers for configured query methods.
- `only-export-components` — allow only React component and type exports.
- `require-file-factory` — derive and require a filename-based factory function.
- `require-object-params` — require exported functions to use object-shaped parameters.
- `require-orpc-output` — require named oRPC output schemas.
- `require-paired-call` — require one configured call when another appears.
- `route-surface` — constrain route exports, hooks, and intrinsic JSX.

Every rule file includes plain-English behavior and examples. Rule tests under `src/tests/` show complete option shapes.

## Development

```bash
bun install
bun run check
```

After production changes, run `bun run sync:skill-assets`; CI verifies the bundled installer copy matches `src/`.

## Release

Update `CHANGELOG.md`, then run the full lifecycle from a clean `main`:

```bash
bun run release              # prompt for patch/minor/major
bun run release:patch        # check, bump, tag, push, npm publish
bun run release:dry-run      # check + npm pack dry-run only
```

`scripts/release.sh` refuses dirty trees and requires `npm login`. `prepublishOnly` runs `bun run check` again before the tarball goes out.

## License

MIT
