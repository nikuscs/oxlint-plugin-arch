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
- [`examples/full.oxlint.config.ts`](examples/full.oxlint.config.ts) — all 30 rules across representative component, action, service, constant, route, API, schema, and database scopes.

Copy the shapes that match your repository; do not copy globs or naming policy blindly.

## Rules

- `declaration-name` — require selected declarations to match a filename-derived prefix or a consumer pattern. Optional `trailingRoles` treat `onchain-utils.ts` like `onchain.utils.ts`.
- `export-file-prefix` — require export names, or every function and type, to start with a filename-derived prefix, optionally singularized. Optional `trailingRoles` drop a configured role suffix from that prefix.
- `export-name-pattern` — require export names, or every function and type, to match a configured regular expression.
- `filename-export-name` — derive expected function names from filename templates, optionally including locals.
- `filename-match` — require filenames to match a configured pattern.
- `folder-prefix` — require filenames to start with their parent folder name, or the folders after a configured root.
- `no-extra-exports` — restrict files to configured export templates. Optional `trailingRoles` apply to `{Domain}` the same way as the prefix rules.
- `no-extra-factory-keys` — restrict direct factory return keys.
- `no-file-level-helpers` — keep unapproved helpers out of module scope.
- `no-imported-type-alias` — reject exported aliases that only rename imported types.
- `no-inline-schema-elements` — require named schemas inside configured combinators.
- `no-inline-types` — require named object and function types in parameter and return annotations. See [options and scope](#no-inline-types).
- `no-local-schema-construction` — reject runtime schema-library imports and local schema construction, with consumer-chosen severity, messages, and path exceptions.
- `no-rederive-schema` — reject type derivation from configured imported schemas.
- `no-restricted-files` — reject files selected by a consumer-owned forbidden glob.
- `no-restricted-token` — restrict an identifier to configured owner paths.
- `no-runtime-in-types` — keep selected type modules runtime-free.
- `no-single-use-scalar-schema` — reject local scalar Zod aliases used once where they can be safely inlined.
- `no-top-level-functions` — reject top-level functions and optional re-exports.
- `no-trivial-functions` — reject empty or passthrough top-level functions.
- `no-type-declarations` — reject type aliases and interfaces in matched files.
- `no-member-comments` — remove leading and same-line trailing comments on object-type members: interface properties and methods, index/call/construct signatures, type-literal members (including inline function parameter types), object literal properties, and object spreads. Autofix removes the comment and any blank line that followed it, consumes the spacing in front of a trailing comment so no line is left with trailing whitespace, and never removes the member. A contiguous run of comments is reported once and removed by a single fix, so `--fix` converges in one pass. `allowWhy` defaults to `true`: comments beginning with `Why: ` (after whitespace/JSDoc decoration), including contiguous `//` continuation lines, are preserved. Set `{ allowWhy: false }` to ban those too. The rule checks the prefix, not whether the rationale is meaningful. Directive comments are always preserved, whatever `allowWhy` says: `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-`/`oxlint-disable`/`enable`, `prettier-ignore`, `biome-ignore`, `c8`/`v8`/`istanbul ignore`, and webpack magic comments. Declaration, function-body, class-field, enum-member, union-member, and plain function-parameter comments are out of scope, as are comments inside destructuring patterns and array literals. Enable with `'arch/no-member-comments': ['error', { allowWhy: true }]` in a `**/*.{ts,tsx}` override.
- `no-unescaped-like` — require configured sanitizers for configured query methods.
- `only-export-components` — allow only React component and type exports.
- `only-export-constants` — allow only local `const` exports, with opt-ins for function values, types, and re-exports. See [options and scope](#only-export-constants).
- `require-file-factory` — derive and require a filename-based factory function.
- `require-object-params` — require exported functions to use object-shaped parameters.
- `require-orpc-output` — require named oRPC output schemas.
- `require-paired-call` — require one configured call when another appears.
- `route-surface` — constrain route exports, hooks, and intrinsic JSX.

Every rule file includes plain-English behavior and examples. Rule tests under `src/tests/` show complete option shapes.

### `no-inline-types`

Require named types in function signatures, including local functions, callbacks, methods, constructors, and overloads. Checks explicit annotations only; inferred types, variable annotations, generic constraints, and named type/interface definitions are not changed or banned. Use `no-type-declarations` separately to control where named types may live.

| Option | Default | Behavior |
| --- | --- | --- |
| `parameters` | `true` | Check parameter annotations, including destructuring, defaults, rest parameters, and constructor parameter properties. |
| `returns` | `true` | Check explicit return annotations. |
| `functionTypes` | `true` | Also reject inline function and constructor types. When `false`, object types nested inside those annotations are still checked. |

Object/function types nested in arrays, tuples, unions, intersections, or generic arguments are checked too (`Promise<{ id: string }>` fails). A rejected outer type is reported once, not again for each nested member.

```ts
// In the consumer's override for service files:
'arch/no-inline-types': ['error', {
  parameters: true,
  returns: true,
  functionTypes: true,
}]

// Pass
function save(input: SaveInput): SaveResult { return persist(input) }
// Fail
function save(input: { id: string }): { ok: boolean } { return persist(input) }
```

### `only-export-constants`

Require every runtime export to reference a local `const` binding. Supports direct exports, destructuring, renamed exports, and default exports of local constants. Non-exported declarations are unrestricted.

| Option | Default | Behavior |
| --- | --- | --- |
| `allowFunctionValues` | `false` | Allow function-valued `const` bindings, not exported function declarations. |
| `allowTypeExports` | `false` | Allow type aliases, interfaces, and type-only exports, including type-only re-exports. |
| `allowReExports` | `false` | Allow runtime re-exports (`export ... from`, `export *`) and exports of imported bindings. Their declaration kind cannot be verified locally. |

`let`, `var`, function/class/enum/namespace declarations, class-valued constants, bare default expressions, and TypeScript `export =` / `export as namespace` are rejected. Name the default value with a local `const` first. Type-only re-exports use `allowTypeExports`, independently of `allowReExports`.

This is a syntax rule, not a deep-immutability or runtime-type check. It recognizes direct function/class values, TypeScript expression wrappers, and local identifier aliases. It does not infer values returned by calls, imported values, member accesses, destructuring, or object contents. Objects and arrays do not need `as const` or `Object.freeze()`.

```ts
// In the consumer's override for constant files:
'arch/only-export-constants': ['error', {
  allowFunctionValues: false,
  allowTypeExports: false,
  allowReExports: false,
}]

// Pass
const retryLimit = 3
export { retryLimit }
// Fail
export let retryCount = 0
export const retry = () => run()
```

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
