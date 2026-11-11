# ⚡ effect

Layout and code rules for Effect code, plus every rule from Effect's tsgo presets and oxlint-effect's recommended set. Opt-in.

The group needs both packages, and lint runs through `effect-tsgo`, which loads the tsgo rules:

```sh
bun add -d @effect/tsgo @opsydyn/oxlint-effect
effect-tsgo --tsrs-lint oxlint --type-aware
```

```ts
folders: {
  'packages/core': { effect: { width: 140 } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `code` | `boolean` | `true` | Effect code rules; with `false` only the project style runs and the two Effect packages are not needed |
| `width` | `number` | `140` | Line width for `eslint-js/max-len`, the layout rules and `code-inline` |
| `exports` | `string \| string[]` | | Regex for files whose exports `code-traced` checks; every non-test file when unset |
| `skip` | `string \| string[]` | | Regex for service names `code-traced` skips, such as `Driver$` |
| `entries` | `string[]` | `[]` | Globs for entry files (servers, Workers, scripts) that provide their own layers |

Project style, in both modes: `typescript/consistent-type-assertions` with `assertionStyle: 'never'` and `eslint-js/max-len` at `width` (ignoring URLs, comments and regular expressions). When installed, each on its own (optional peer dependencies), it also loads `eslint-plugin-regexp` (`flat/recommended`), `eslint-plugin-de-morgan` (`recommended`) and `eslint-plugin-sonarjs` (`sonarjs/super-linear-regex` only); a package that is not installed adds nothing.

Effect code, with `code` on: the rules below, plus [`arch/code-object-params`](../rules/code-object-params.md) with `all: true, services: true`, [`arch/code-switch`](../rules/code-switch.md) with "Branch with Match." and `arch/naming-exports` off. It turns off [`arch/code-trivial-functions`](../rules/code-trivial-functions.md), which reports an Effect function written as one pipe.

Every workspace that depends on `effect` (and `recipes.effect`) bans these imports; an app drops one with `false` under `deny.imports`:

| Import | Message |
| --- | --- |
| `effect` | Import the module subpath, such as effect/Effect. |
| `zod` | Use effect/Schema. |
| `ts-pattern` | Use effect/Match. |
| `dayjs` | Use effect/DateTime. |

A React package or framework app that depends on `effect` keeps its own recipe and gets `effect: { code: false }`: the project style and the import bans, no Effect code rules.

[`arch/effect-layer-file`](../rules/effect-layer-file.md) and [`arch/effect-schema-first`](../rules/effect-schema-first.md) need your layer and types file globs, so the group leaves them off.

Rules: [`arch/code-branch-once`](../rules/code-branch-once.md), [`arch/code-function-nesting`](../rules/code-function-nesting.md), [`arch/code-inline`](../rules/code-inline.md), [`arch/code-justified-call`](../rules/code-justified-call.md) for `Effect.promise` and [`arch/code-traced`](../rules/code-traced.md) outside tests, [`arch/code-yield-argument`](../rules/code-yield-argument.md), [`arch/effect-layers`](../rules/effect-layers.md), [`arch/effect-merge-pipe`](../rules/effect-merge-pipe.md), [`arch/effect-values-first`](../rules/effect-values-first.md), [`arch/layout-arrow-body`](../rules/layout-arrow-body.md), [`arch/layout-call-arguments`](../rules/layout-call-arguments.md) with `hug` and `join`, [`arch/layout-call-depth`](../rules/layout-call-depth.md), [`arch/layout-items`](../rules/layout-items.md), [`arch/layout-pipe`](../rules/layout-pipe.md), [`arch/layout-ternary`](../rules/layout-ternary.md) with `branch`.

Third-party rules: every rule in [`@effect/tsgo`](https://www.npmjs.com/package/@effect/tsgo)'s `correctness`, `antipattern`, `effectNative` and `style` presets, raised to the group's level, and [`@opsydyn/oxlint-effect`](https://www.npmjs.com/package/@opsydyn/oxlint-effect)'s `recommended` rules. It turns off the oxlint-effect rules that contradict the group's own rules:

| Rule | Contradicts |
| --- | --- |
| `linteffect/no-effect-fn-generator` | `arch/code-traced`, which asks for `Effect.fn` |
| `linteffect/prefer-extracted-concept`, `linteffect/no-clever-effect-expression`, `linteffect/no-mixed-pillar-function`, `linteffect/no-piped-yield-in-gen`, `linteffect/no-domain-logic-in-conditional` | `arch/code-inline`, which keeps single-use values inline |
| `linteffect/prefer-pipe-for-behavior` | `arch/layout-pipe`, which allows a data-first step around a multi-line call |
| `linteffect/no-ternary` | `arch/layout-ternary`, which allows value ternaries |
| `linteffect/no-effect-as` | `effecttsgo/map-const-to-as`, which asks for `Effect.as` |

It also turns off the oxlint-effect rules that flag common Effect idioms:

| Rule | Flags |
| --- | --- |
| `linteffect/no-namespace-effect-import` | `import * as Effect from 'effect/Effect'` |
| `linteffect/no-manual-effect-channels` | Service interfaces that declare their `Effect<A, E, R>` channels |
| `linteffect/no-or-die-outside-boundary` | `Effect.orDie` on an impossible failure |
| `linteffect/no-call-tower` | `Effect.fn` extra arguments and `Effect.acquireRelease(Effect.sync(...))` |
| `linteffect/no-pipe-ladder` | `Schedule.exponential(...).pipe(Schedule.jittered)` inside `Effect.retry` |
| `linteffect/no-nested-effect-gen` | An inline program (a transaction, a fork) written as `Effect.gen` |
| `linteffect/no-branch-in-object` | The handlers of `Option.match(x, { onNone, onSome })` |
| `linteffect/no-magic-domain-string` | Typed literal and `_tag` checks |
| `linteffect/no-return-in-arrow` | `it.effect(..., () => Effect.gen(function* () { return ... }))` |
| `linteffect/no-effect-succeed-variable` | `Effect.succeed(value)` as one branch of a ternary or `Option.match` |
| `linteffect/no-match-effect-branch` | `Option.match`, `Array.match` and `Match` branches that are effects |

In test files it also turns off `linteffect/no-string-sentinel-return`, `linteffect/no-effect-never`, `linteffect/no-gen-for-mapping` and `linteffect/no-adhoc-domain-error`, so a test can fail with a plain string. In test files and `entries` it turns off `effecttsgo/strict-effect-provide`, `linteffect/no-inline-runtime-provide` and `linteffect/no-inline-layer-provide-in-program`: an entry provides its own layers.

## What an Effect server gets

A unit with the `effect` group whose source holds `domains/` is an Effect server: it gets the `backend` recipe's groups under your own settings, with `services: 'domains'`, so the backend conventions (migrations, `tests/kits`, the web and package bans on server internals) apply. Detection adds these keys too, relative to the unit; `S` is its source and `D` is `S/domains`. Write the same key to change one: lists add, objects merge, `false` and `'off'` turn an entry off.

| Key | Sets |
| --- | --- |
| `S` | `deny.imports`: `@tanstack/*`, `react-dom`, `react-dom/**`, `next`, `next/**`, `vite` and `effect/Config`; `rules`: `arch/types-declarations` with `modules: true`, `arch/types-inline` with `variables`, `assertions` and `arguments`, `arch/comments-code` with `why: false`, `jsdoc: true`, `allow: ['^\\s*SAFETY: ']` |
| the unit | `types: { placement: false }`: none of the `types` group's placement advice |
| `D` | `layout.files`: adds `*.actions.ts`, `*.queries.ts`, `*.layer.ts`, `*.workflows.ts`, `*.prompts.ts`, `*-*.driver.ts`; removes `*.service.ts`, `*.client.ts`, `*.server.ts`, `*.rsc.ts`, `*.rsc.tsx`, `*.utils.ts`, `*.types.ts`, `*.handler.ts`, `*-action.*.ts`, `*-query.*.ts`; `deny.imports`: `../*/*.constants{,.ts}` |
| `D/*/*.actions.ts` | `limits.lines` 1000; `arch/files-exports` with `stem: 'folder'`, `patterns: ['{domain}Action[A-Z]\\w*']`, `types: true` |
| `D/*/*.queries.ts` | `limits.lines` 1000; `arch/files-exports` with `patterns: ['{domain}Query[A-Z]\\w*']`; `deny.calls`: `insertInto`, `updateTable`, `deleteFrom`, `mergeInto`, `replaceInto`, `dispatch`, `send`; `deny.imports`: `./*.actions{,.ts}` |
| `D/*/*.constants.ts` | `arch/files-no-functions` |
| `D/*/*.layer.ts`, `D/*/*.driver.ts` | [`arch/effect-layer-file`](../rules/effect-layer-file.md) |
| `D/*/*.workflows.ts` | `deny.calls`: `selectFrom` and the write calls; `deny.imports`: `**/database`, `./*.{actions,queries}{,.ts}` |
| `S/application/app.config.ts` | `deny.imports`: `'effect/Config': false` |
| `S/application/app.ts` | `arch/boundaries-imports` off; `deny.imports`: `**/domains/*/!(*.layer|*.layer.ts|*.workflows|*.workflows.ts)` |
| `S/**/*.tsx` | `arch/files-restricted`: mail templates are the only JSX on a server |
| `S/mails/*.mail.tsx` | `arch/files-restricted` off |
| `S/rpc` | [`arch/code-delegate`](../rules/code-delegate.md) |

A domain's other files stay private through [`arch/boundaries-imports`](../rules/boundaries-imports.md).

```ts
folders: {
  'apps/server/src/domains': { layout: { files: ['*.gateway.ts'] } },
  'apps/server/src/domains/*/*.actions.ts': { limits: { lines: 1500 } },
  'apps/server/src/rpc': { rules: { 'arch/code-delegate': 'off' } },
}
```

## What a contract package gets

A unit with the `effect` group that is not a server and whose source holds a `<d>/<d>.contract.ts` is a contract package. Detection adds these keys, relative to the unit; `C` is its source. Later keys win on the files they share.

| Key | Sets |
| --- | --- |
| the unit | `types: { placement: false }`: a contract declares its types next to its Schemas |
| `C/*/*.ts` | `arch/naming-file`: `<d>.schemas.ts`, `<d>-<part>.schemas.ts`, `<d>.admin.schemas.ts`, `<d>.contract.ts`, `<d>.admin.contract.ts`, `<d>.errors.ts`, `<d>.layer.types.ts`; `arch/naming-folder` with `singularize: 'none'`, `separators: ['.', '-']`; `arch/files-exports` with `stem: 'folder'`, `singularize: 'trailing-s'`, `patterns: ['{Domain}\\w*']` |
| `C/*/*.admin.*.ts` | `arch/files-exports` with `patterns: ['Admin{Domain}\\w*']` |
| `C/*/*.schemas.ts`, `C/*/*.contract.ts` | `arch/files-no-functions` with `reexports: false`; `arch/files-constants-only` with `types: true`, `functions: true`; `arch/types-imported-alias`; `arch/schemas-single-use` with `namespaces: ['Schema']`, `methods: ['Array', 'Union', 'Record', 'Tuple']`, `structural: ['Struct', 'Array', 'Union', 'Record', 'Tuple', 'NullOr', 'UndefinedOr', 'optional', 'TaggedStruct']` |
| `C/*/*.errors.ts`, `C/*/*.layer.types.ts` | `arch/files-no-functions` |
| `C/shared/*.ts` | `arch/naming-file`, `arch/naming-folder`, `arch/files-exports` and `arch/files-no-functions` off; `arch/files-constants-only` with `types: true`, `functions: true` |
| `C/contract*.ts` | `arch/files-constants-only` with `types: true`, `functions: true`; `arch/types-imported-alias`; `arch/schemas-single-use` |

```ts
folders: {
  'packages/contract/src/*/*.ts': { rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{Domain}[A-Z]\\w*'] }] } },
  'packages/contract/src/*/*.layer.types.ts': { rules: { 'arch/files-exports': 'off' } },
}
```

## Error classes

Every unit with the `effect` group (server, contract or plain package) builds tagged errors only in `*.errors.ts`.

| Key | Sets |
| --- | --- |
| the unit | `deny.calls`: `Schema.TaggedError`, `Schema.ErrorClass`, `Data.TaggedError`, `Data.Error` |
| `<source>/**/*.errors.ts` | the four entries set to `false` |

```ts
folders: {
  'packages/contract': { deny: { calls: { 'Data.Error': false } } },
  'packages/contract/src/**/*.errors.ts': { rules: { 'arch/boundaries-deny': 'off' } },
}
```

## What a frontend package gets

A React package (not a framework app) with the `effect` group in either mode and `pages/` or `link.tsx` (or `link.ts`) in its source is a frontend package. Detection adds these keys; `F` is its source. Any React package with `pages/` or a link file, with or without `effect`, gets its `services/` laid out flat when it holds more files than folders.

| Key | Sets |
| --- | --- |
| the unit | `forms: true` |
| `F` | [`arch/react-query-props`](../rules/react-query-props.md); `deny.imports`: `@orpc/*`; `no-restricted-imports` with `@tanstack/react-router` (`allowImportNames: ['ClientOnly']`), `next/link`, `next/navigation`, `next/router` and `expo-router`, plus the imports group's patterns |
| `F/link.tsx`, `F/link.ts` | `no-restricted-imports` back to the imports group's setting |
| `F/services/**/*.client.ts` | `arch/backend-service-functions` with `frontend: true` |

```ts
folders: {
  'packages/frontend/src': { rules: { 'arch/react-query-props': 'off' } },
}
```

## What the web app gets

In a project with a contract package, a TanStack or Next app imports the contract's root entry as types only: `no-restricted-imports` on its source holds `{ name: <contract package>, allowTypeImports: true }` with the imports group's patterns, and a TanStack app keeps its `@tanstack/react-start/rsc` path. Its `services/**/*.rsc.ts` and `*.rsc.tsx` files get the contract path without the rsc one. Subpaths stay free.

## What a UI kit gets

A UI kit (`kit` on) with the `effect` group in either mode bans `<name>` and `<name>/**` of every other workspace package that is not a UI kit: "A UI kit imports no app package." Drop one with `false` under `deny.imports`.
