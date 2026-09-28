# 🏛️ oxlint-plugin-arch

> Architecture rules for [Oxlint](https://oxc.rs), driven by filenames and fully configurable.

Keep a codebase shaped the way you designed it: files in the right folders, exports named after their file, types where they belong, and no shortcuts across boundaries. Every rule is generic, so **you** decide the paths, names, and policy in your own Oxlint config.

- 🗂️ **Filename-aware.** Rules derive expected names from the file they run on (`user-action.create.ts` → `makeUserActionCreate`).
- 🎛️ **Configurable.** No app names, folders, or libraries are baked in. Globs and policy live in your config.
- 🛟 **Safe autofix.** Fixable rules only touch whitespace or comments, and never guess when a fix could change your code.
- ⚡ **Fast.** Built on Oxlint's JS plugin API and ESTree, with no extra parser.

---

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
| [`full.oxlint.config.ts`](examples/full.oxlint.config.ts) | You want to see every one of the 42 rules with its options. |

> [!TIP]
> `monorepo.oxlint.config.ts` already loads `oxlint-plugin-arch`, so you can copy it as-is and adjust globs and names. The other two load `../src/index.ts`; change that specifier to `oxlint-plugin-arch` when you copy them.

---

## 🧩 Rules

42 rules in 9 groups. 🔧 means the rule can autofix. Each rule file in [`src/rules/`](src/rules) explains its behavior in plain English, and the tests in [`src/tests/`](src/tests) show every option shape.

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
| `export-file-prefix` | Export names (or every function and type) start with the filename prefix. `trailingRoles` treats `onchain-utils.ts` like `onchain.utils.ts`. |
| `export-name-pattern` | Export names (or every function and type) match a regular expression. |
| `filename-export-name` | Function names follow a template built from the filename. |
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
| `no-trivial-functions` | No empty or pass-through wrapper functions. `allowCallees` keeps intentional wrappers. |
| `no-module-mutable-state` | No module-level `let`/`var`, which is shared across requests and tests. |

### 🔷 Types

| Rule | What it enforces |
| --- | --- |
| `no-inline-types` | Function signatures use named types instead of inline `{ ... }` objects. [Details ↓](#no-inline-types) |
| `no-type-declarations` | No type aliases or interfaces in matched files, so types live in one place. |
| `no-runtime-in-types` | Type modules stay free of runtime code. Opt in to also ban runtime imports and re-exports. |
| `no-imported-type-alias` | No exported aliases that only rename an imported type. |

### 🧪 Schemas & APIs

| Rule | What it enforces |
| --- | --- |
| `no-local-schema-construction` | No schemas built outside the files that own them. |
| `no-inline-schema-elements` | Named schemas inside combinators like `z.array(...)`. |
| `no-rederive-schema` | No re-deriving types from schemas imported from elsewhere. |
| `no-single-use-scalar-schema` | Scalar Zod aliases used once get inlined. |
| `require-orpc-output` | oRPC procedures declare a named `.output()` schema. |
| `no-unescaped-like` | `LIKE` / `ILIKE` values pass through your sanitizer. |

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
| `padding-between-statements` 🔧 | Blank lines around functions and classes, around control flow, and before `return` in longer blocks. |
| `object-multiline` 🔧 | Objects with 3+ properties passed to a call go one property per line (`scope: 'all'` for every object). |
| `key-value-same-line` 🔧 | An object key and the start of its value stay on the same line. |
| `chain-newline` 🔧 | Long method chains go one call per line. You pick which chains with `groups`. |
| `call-array-multiline` 🔧 | Arrays passed to `Promise.all` (or callees you list) go one element per line. |
| `jsx-attributes-multiline` 🔧 | JSX tags with 3+ attributes go one attribute per line. |

> [!WARNING]
> Oxfmt and Prettier collapse short chains, arrays, and JSX tags back onto one line. Don't run `chain-newline`, `call-array-multiline`, or `jsx-attributes-multiline` on files a formatter also rewrites, or they will undo each other forever.

---

## 🔍 Rule details

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
    { token: 'RouterClient', allowIn: ['/src/services/rpc.client.ts'] },
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
