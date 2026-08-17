# oxlint-plugin-arch

Configurable, filename-aware architecture rules for Oxlint.

This repository follows anti-slop's vendoring model: `src/` is raw TypeScript, the package is private, and consumers copy the plugin into their own repository so they can inspect and adapt the policy. No npm publication or build step is required.

## Recommended companion: anti-slop

We recommend [Dillon Mulroy's anti-slop](https://github.com/dmmulroy/anti-slop) alongside this plugin. Anti-slop catches low-evidence TypeScript and JavaScript implementation patterns; oxlint-plugin-arch enforces configurable file, export, boundary, and API structure. Both projects vendor readable raw TypeScript so teams can inspect and adapt the rules they adopt.

Use either project independently, or register both vendored plugins in the same Oxlint config under their separate `anti-slop/*` and `arch/*` rule namespaces.

## Install with an agent skill

```bash
npx skills add nikuscs/oxlint-plugin-arch --skill install-oxlint-arch
```

Then ask your agent to install the plugin. The installer accepts the destination that fits the consumer repository:

```bash
bun <skill-directory>/scripts/install.ts
bun <skill-directory>/scripts/install.ts packages/tooling/src/oxlint/arch
bun <skill-directory>/scripts/install.ts --target tools/lint/arch
```

The default destination is `tools/oxlint/arch`. Relative paths resolve from the consumer repository; absolute paths are also accepted. Existing destinations are never replaced unless `--force` is explicitly supplied.

## Manual installation

Copy `src/index.ts`, `src/rules/`, and `src/utils/` to a consumer-owned directory, install matching versions of `oxlint` and `@oxlint/plugins`, then register the copied entry point:

```ts
export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: './tools/oxlint/arch/index.ts' },
  ],
})
```

Rules intentionally contain no repository paths. Consumers choose file globs and options in `oxlint.config.ts`.

## Configuration examples

- [`examples/minimal.oxlint.config.ts`](examples/minimal.oxlint.config.ts) — three small rules showing plugin registration, glob ownership, and options.
- [`examples/full.oxlint.config.ts`](examples/full.oxlint.config.ts) — all 24 rules across representative component, action, service, route, API, schema, and database scopes.

Copy the shapes that match your repository; do not copy globs or naming policy blindly. When vendoring to a different destination, update only the `jsPlugins[].specifier` path.

To use anti-slop as well, add its vendored entry point to the same `jsPlugins` array and keep its `anti-slop/*` rules beside the `arch/*` overrides shown here.

## Rules

- `export-file-prefix` — require export names to start with a filename-derived prefix.
- `export-name-pattern` — require exports to match a configured regular expression.
- `filename-export-name` — derive expected exported function names from filename templates.
- `filename-match` — require filenames to match a configured pattern.
- `folder-prefix` — require filenames to start with their parent folder name.
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
- `no-unescaped-like` — require configured sanitizers for configured query methods.
- `only-export-components` — allow only React component and type exports.
- `require-file-factory` — derive and require a filename-based factory export.
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

## License

MIT
