# ⚡ effect

Layout and code rules for Effect code, plus every rule from Effect's tsgo presets and oxlint-effect's recommended set. Opt-in.

The group needs both packages, and lint runs through `effect-tsgo`, which loads the tsgo rules:

```sh
bun add -d @effect/tsgo @opsydyn/oxlint-effect
effect-tsgo --tsrs-lint oxlint --type-aware
```

```ts
folders: {
  'packages/core': { effect: { width: 160 } },
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
| `strict` | `boolean \| Record<area, boolean>` | `true` | Effect server and contract package: the [locked file shapes](#locked-by-default) below. `false` keeps only the names and bans; an object turns single areas off: `{ tests: false }` |
| `files` | `string[]` | `[]` | Contract package: file kinds to add, such as `*.policy.ts`; `!*.layer.types.ts` removes one. Set on the package folder |
| `module` | `string \| object` | off | [Module package layout](#what-an-effect-module-package-gets): the folder name template (`'kit-{module}'`), `'flat'`, or an object with `name` and the options below |
| `errors` | `{ files?, base?, constructors?, message?, tag?, code? }` | `**/*.errors.ts` | [Error classes](#error-classes): where they live, the one file that may call the raw constructors, the constructor list and its message, the tag and code shape |
| `yields` | `{ names?, allow? }` | none | Options for [`arch/effect-yield-name`](../rules/effect-yield-name.md) wherever a convention turns it on (server and module package) |
| `labels` | `Record<string, entry[]>` | none | Extra [`arch/naming-labels`](../rules/naming-labels.md) entries by file pattern, relative to the source: `{ 'domains/*/*.workflows.ts': [{ callee: 'Activity.make', name: '{name}' }] }`. On a pattern a convention uses, they join its entries; on another pattern they are that file kind's only labels |
| `handlers` | `{ allow? }` | none | `allow` for the rpc handler [`arch/naming-keys`](../rules/naming-keys.md): key paths that need not delegate |
| `server` | object | the values below | [Server knobs](#server-knobs): `folders`, `kinds`, `operations`, `spans`, `rpc`, `tests` |
| `contract` | object | the values below | [Contract knobs](#contract-knobs): `kinds`, `root`, `service` |

Project style, in both modes: `typescript/consistent-type-assertions` with `assertionStyle: 'never'` and `eslint-js/max-len` at `width` (ignoring URLs, comments, regular expressions, strings and template literals). When installed, each on its own (optional peer dependencies), it also loads `eslint-plugin-regexp` (`flat/recommended`), `eslint-plugin-de-morgan` (`recommended`) and `eslint-plugin-sonarjs` (`sonarjs/super-linear-regex` only); a package that is not installed adds nothing.

Effect code, with `code` on: the rules below, plus [`arch/code-object-params`](../rules/code-object-params.md) with `all: true, services: true`, [`arch/code-switch`](../rules/code-switch.md) with "Branch with Match." and `arch/naming-exports` off. It turns off [`arch/code-trivial-functions`](../rules/code-trivial-functions.md), which reports an Effect function written as one pipe.

Every unit with the `effect` group on, in either mode (detected for a workspace that depends on `effect`), and `recipes.effect` ban these imports; `effect: false` drops them all, and `false` under `deny.imports` drops one:

| Import | Message |
| --- | --- |
| `effect` | Import the module subpath, such as effect/Effect. |
| `zod` | Use effect/Schema. |
| `ts-pattern` | Use effect/Match. |
| `dayjs` | Use effect/DateTime. |

An Effect server or contract package also bans `ai` and `@ai-sdk/**` with "Use effect/ai."; frontend packages keep them.

A React package or framework app that depends on `effect` keeps its own recipe and gets `effect: { code: false }`: the project style and the import bans, no Effect code rules.

[`arch/effect-layer-file`](../rules/effect-layer-file.md) and [`arch/effect-schema-first`](../rules/effect-schema-first.md) need your layer and types file globs, so the group leaves them off.

Rules: [`arch/code-branch-once`](../rules/code-branch-once.md), [`arch/code-function-nesting`](../rules/code-function-nesting.md), [`arch/code-inline`](../rules/code-inline.md), [`arch/code-justified-call`](../rules/code-justified-call.md) for `Effect.promise` and [`arch/code-traced`](../rules/code-traced.md) outside tests, [`arch/code-yield-argument`](../rules/code-yield-argument.md), [`arch/effect-layers`](../rules/effect-layers.md), [`arch/effect-merge-pipe`](../rules/effect-merge-pipe.md), [`arch/effect-values-first`](../rules/effect-values-first.md), [`arch/layout-arrow-body`](../rules/layout-arrow-body.md), [`arch/layout-call-arguments`](../rules/layout-call-arguments.md) with `hug`, `join` and `pipe: { min: 2 }`, [`arch/layout-call-depth`](../rules/layout-call-depth.md) with `callbacks`, [`arch/layout-items`](../rules/layout-items.md), [`arch/layout-object`](../rules/layout-object.md) with `params`, `nested`, `siblings` and `inner: 2`, [`arch/layout-pipe`](../rules/layout-pipe.md), [`arch/layout-ternary`](../rules/layout-ternary.md) with `max: 100` and `branch`, [`arch/layout-type-arguments`](../rules/layout-type-arguments.md).

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
| `S` | `deny.imports`: `@tanstack/*`, `react-dom`, `react-dom/**`, `next`, `next/**`, `vite` and `effect/Config`; `rules`: `arch/types-declarations` with `modules: true`, `arch/types-inline` with `variables`, `assertions` and `arguments`, `arch/comments-code` with `why: false`, `jsdoc: true`, `allow: ['^\\s*SAFETY: ']`, `steps: true` |
| the unit | `types: { placement: false }`: none of the `types` group's placement advice |
| `D` | `layout.files`: adds `*.actions.ts`, `*.queries.ts`, `*.layer.ts`, `*.workflows.ts`, `*.prompts.ts`, `*-*.driver.ts`, `*.config.ts` and keeps `*.utils.ts`; removes `*.service.ts`, `*.client.ts`, `*.server.ts`, `*.rsc.ts`, `*.rsc.tsx`, `*.types.ts`, `*.handler.ts`, `*-action.*.ts`, `*-query.*.ts`; `deny.imports`: `../*/*.constants{,.ts}` |
| `D/*/*.actions.ts` | `arch/files-exports` with `stem: 'folder'`, `patterns: ['{domain}Action[A-Z]\\w*']`, `types: true`; [`arch/naming-labels`](../rules/naming-labels.md): an `Effect.fn` span is its function's name without `Action` or `Query`, dots and case aside (`orderActionScheduleCancel` is `'order.schedule.cancel'`) |
| `D/*/*.queries.ts` | the same `arch/naming-labels`; `arch/files-exports` with `patterns: ['{domain}Query[A-Z]\\w*']`; `deny.calls`: `insertInto`, `updateTable`, `deleteFrom`, `mergeInto`, `replaceInto`, `dispatch`, `send`; `deny.imports`: `./*.actions{,.ts}` |
| `D/*/*.constants.ts` | `arch/files-no-functions` with `reexports: false` |
| `D/*/*.layer.ts`, `D/*/*.driver.ts` | [`arch/effect-layer-file`](../rules/effect-layer-file.md) with `suffix: 'Layer'`: local layers are `<Role>Layer` |
| `D/*/*.workflows.ts` | `arch/naming-labels`: a `Workflow.make` name is its constant without `Workflow`, an `Activity.make` `name` is kebab-case; `deny.calls`: `selectFrom` and the write calls; `deny.imports`: `**/database`, `./*.{actions,queries}{,.ts}` |
| `S/application/app.config.ts`, `D/*/*.config.ts` | `deny.imports`: `'effect/Config': false` |
| `S/application/app.ts` | `arch/boundaries-imports` off; `deny.imports`: `**/domains/*/!(*.layer|*.layer.ts|*.workflows|*.workflows.ts)` |
| `S/**/*.tsx` | `arch/files-restricted`: mail templates are the only JSX on a server |
| `S/mails/*.mail.tsx` | `arch/files-restricted` off |
| `S/mails/*.mail.ts` | `linteffect/prevent-dynamic-imports` off |
| `S/rpc` | [`arch/code-delegate`](../rules/code-delegate.md) |

A domain's other files stay private through [`arch/boundaries-imports`](../rules/boundaries-imports.md).

```ts
folders: {
  'apps/server/src/domains': { layout: { files: ['*.gateway.ts'] } },
  'apps/server/src/domains/*/*.actions.ts': { limits: { lines: 1500 } },
  'apps/server/src/rpc': { rules: { 'arch/code-delegate': 'off' } },
}
```

## Locked by default

With `strict` on (the default), an Effect server and a contract package also get these, so a new file has one shape it can take. Restate a key to change one rule, set `effect: { strict: false }` on the app or package to drop them all, or turn one area off with `effect: { strict: { tests: false } }`. Server areas are `code`, `places`, `domains`, `rpc`, `mails` and `tests`; contract areas are `places`, `kinds`, `service` and `errors`.

| Area | Key | Sets |
| --- | --- | --- |
| `code` | `S` | [`arch/effect-yield-name`](../rules/effect-yield-name.md) (with `effect.yields`), [`arch/effect-yields-first`](../rules/effect-yields-first.md); [`arch/code-inside`](../rules/code-inside.md): no `*Workflow.execute` inside `*.transaction` |
| `places` | `S/*.ts`, every folder of `S` but `application`, `domains`, `rpc` and `mails` | [`arch/files-restricted`](../rules/files-restricted.md): server code lives in those folders (`effect.server.folders`); open another with `'off'` on its key |
| `places` | `S/rpc/*/*/**` | no folder below a handler group |
| `rpc` | `S/rpc/*.ts` | files beside the handler groups are `rpc.<name>.ts` |
| `domains` | `D` | `naming.imports`: `'./{file}.ts'` as the namespace `{File}` (`import * as OrderActions from './order.actions.ts'`) |
| `domains` | `D/*/*.actions.ts`, `D/*/*.queries.ts`, `D/*/*.utils.ts` | `top`: only exported constants built by `Effect.fn`, and `decode<What>` constants read at least twice; in `utils` the span is the function's name |
| `domains` | `D/*/*.layer.ts` | [`arch/naming-keys`](../rules/naming-keys.md): a value bound by `*.bind` or `*.of` is `<d>Action<Path>` or `<d>Query<Path>`, never an inline function; with a contract package, [`arch/effect-layer-keys`](../rules/effect-layer-keys.md) against `<contract>/<d>/<d>.service.ts` |
| `domains` | `D/*/*.workflows.ts` | `top`: only constants built by `Workflow.make`, `.toLayer`, `Layer.*` or `Schedule.*`; exports named `<D>…Workflow`, `<D>WorkflowsLayer` or `<d>Schedule<Name>`; the span inside `X.toLayer(Effect.fn('…'))` follows `X` |
| `domains` | `D/*/*.constants.ts` | `top`: only exported constants named `<D>_…` |
| `domains` | `D/*/*.config.ts` | `top`: only exported constants named `<d>…Config` |
| `domains` | `D/*/*.prompts.ts` | `top`: only exported constants; exports named `<d>Prompt<Name>` |
| `rpc` | `S/rpc/*/*.ts` | file `rpc/<group>/rpc.<group>.<area>.ts`, one exported constant `rpc<Group><Area>` (`effect.server.rpc`); [`arch/naming-keys`](../rules/naming-keys.md) `delegate`: a handler under `schedule.cancel` returns the call `<service>.schedule.cancel` (`effect.handlers.allow` skips key paths) |
| `mails` | `S/mails/*.mail.tsx` | exports `<name>Mail` and `<Name>Email` |
| `tests` | `tests/**/*.test.ts`, `test/**/*.test.ts`, `tests/**/*.spec.ts`, `test/**/*.spec.ts` | `top`: only `describe*`, `it*`, `test*` and `layer*` calls (`effect.server.tests`); [`arch/code-function-nesting`](../rules/code-function-nesting.md) with `max: 5`; `arch/effect-yield-name` off |
| `places` | `C/*.ts`, `C/*/*/**` | files beside the contract folders are `contract.ts`, `contract.<name>.ts`, `errors.ts` or `index.ts` (`effect.contract.root`); a contract folder holds no folder |
| `kinds` | `C/*/*.schemas.ts` | `top`: types, interfaces, `declare module` and exported constants; in `C/shared/*.schemas.ts` also exported function constants |
| `kinds` | `C/*/*.tables.ts` | `top`: types and `declare module` |
| `kinds` | `C/*/*.contract.ts` | `top`: types, exported constants, and unexported constants built by a namespace call; `deny.calls`: `Schema.Struct` (name it in `<d>.schemas.ts`); [`arch/files-siblings`](../rules/files-siblings.md): `<d>.service.ts` beside it, unless `effect.files` removes that kind |
| `kinds` | `C/*/*.service.ts` | `top`: interfaces, types, one class, `declare module`; only exported classes when the contract has `*.tables.ts` files |
| `service` | `C/*/*.service.ts` | the `Context.Service` key is `<package>/<d>/<d>.service/<Class>` (`effect.contract.service`); [`arch/effect-service-params`](../rules/effect-service-params.md): a method takes `<D>…Params`, or a `<Name>Schemas.` type (`allow: ['^\\w+Schemas\\.']`) |
| `kinds` | `C/*/*.errors.ts` | `top`: exported classes only |
| `errors` | `C/*/*.errors.ts` | an error's tag is its class name, and a `code` is `SCREAMING_CASE` (`effect.errors.tag`, `effect.errors.code`) |

```ts
folders: {
  'apps/server': { effect: { strict: { tests: false } } },
  'apps/server/src': { rules: { 'arch/effect-yield-name': ['error', { names: { 'Database.Database': 'db' }, allow: '^kit' }] } },
  'apps/server/src/domains/*/*.layer.ts': { rules: { 'arch/naming-keys': ['error', { callees: ['Domain.bind'], name: '^{folder}(?:Action|Query){Path}$' }] } },
  'apps/server/tests/**/*.test.ts': { top: ['describe', 'it', 'it.effect'] },
  'apps/server/src/lib': { rules: { 'arch/files-restricted': 'off' } },
  'packages/contract/src/*/*.service.ts': { rules: { 'arch/effect-service-params': ['error', { allow: 'Kit\\.' }] } },
  'packages/contract/src/api/*.contract.ts': { rules: { 'arch/files-siblings': 'off' } },
}
```

A whole project config that tunes these keys, with a comment on every entry, is in [`examples/effect.oxlint.config.ts`](../../examples/effect.oxlint.config.ts).

## Server knobs

`effect.server` on the server's folder changes the conventions above instead of restating their keys. Lists take names to add and `!name` to remove one.

| Option | Default | |
| --- | --- | --- |
| `folders` | `application`, `domains`, `rpc`, `mails` | Folders server code may live in |
| `kinds` | the `D` file names above | Domain file kinds (`D` `layout.files`): `['*.gateway.ts', '!*.prompts.ts']`; a removed kind is also removed from the inherited `layout.files` |
| `operations` | `{ actions: 'Action', queries: 'Query' }` | The word in operation names: `{domain}Action…` exports, the span words dropped, the layer keys `<d>Action<Path>` |
| `spans` | `true` | `false` drops the span check in actions and queries files |
| `rpc` | `{ file: '{group}/rpc.{group}.{area}.ts', names: ['rpc{Group}{Area}'] }` | Handler file template under `rpc/` and its export names |
| `tests` | `tests/**/*.test.ts`, `test/**/*.test.ts`, `tests/**/*.spec.ts`, `test/**/*.spec.ts` | Test globs from the unit folder whose top level is locked; `false` locks none |

```ts
folders: {
  'apps/server': {
    effect: {
      server: { folders: ['jobs'], kinds: ['*.gateway.ts'], operations: { actions: 'Command' }, rpc: { file: '{group}/{area}.rpc.ts', names: ['{area}Rpc'] } },
      yields: { names: { 'Database.Database': 'db' }, allow: '^kit' },
      labels: { 'domains/*/*.workflows.ts': [{ callee: 'Activity.make', name: '{name}' }] },
      handlers: { allow: '^health$' },
    },
  },
}
```

## Contract knobs

`effect.contract` on the contract package folder.

| Option | Default | |
| --- | --- | --- |
| `kinds` | none | File kinds by name: a `top` list adds the kind with that top level (or replaces a built-in kind's), `true` adds it with no top level (a built-in kind keeps its own), `false` removes it. `effect.files` still adds and removes kinds |
| `root` | `contract.ts`, `contract.*.ts`, `errors.ts`, `index.ts` | Files allowed beside the contract folders; `!name` removes one |
| `service` | `'{package}/{folder}/{file}/{name}'` | The `Context.Service` key template; `{package}` is the package name. `false` drops the check |

```ts
folders: {
  'packages/contract': {
    effect: {
      contract: { kinds: { '*.policy.ts': ['type', { kind: 'const', exported: true }], '*.admin.schemas.ts': false }, root: ['!index.ts'], service: '{package}:{name}' },
    },
  },
}
```

## What a contract package gets

A unit with the `effect` group that is not a server and whose source holds a `<d>/<d>.contract.ts` is a contract package. Detection adds these keys, relative to the unit; `C` is its source. Later keys win on the files they share.

The file kinds follow what the contract holds: a `<d>.tables.ts` anywhere adds the `*.tables.ts` kind (and narrows the service top level above), a `<d>.constants.ts` adds the `*.constants.ts` kind, and `*.layer.types.ts` drops out when the contract has `<d>.service.ts` files and no `<d>.layer.types.ts`. `effect.files` and `effect.contract.kinds` still add or remove any kind.

| Key | Sets |
| --- | --- |
| the unit | `types: { placement: false }`: a contract declares its types next to its Schemas |
| `C/*/*.ts` | `arch/naming-file`: `<d>.schemas.ts`, `<d>-<part>.schemas.ts`, `<d>.admin.schemas.ts`, `<d>.contract.ts`, `<d>.admin.contract.ts`, `<d>.errors.ts`, `<d>.layer.types.ts`, `<d>.service.ts`, plus the kinds in `effect.files`; `arch/naming-folder` with `singularize: 'none'`, `separators: ['.', '-']`; `arch/files-exports` with `stem: 'folder'`, `singularize: 'trailing-s'`, `patterns: ['{Domain}\\w*']` |
| `C/*/*.admin.*.ts` | `arch/files-exports` with `patterns: ['Admin{Domain}\\w*']` |
| `C/*/*.schemas.ts`, `C/*/*.contract.ts` | `arch/files-no-functions` with `reexports: false`; `arch/files-constants-only` with `types: true`, `functions: true`; `arch/types-imported-alias`; `arch/schemas-single-use` with `namespaces: ['Schema']`, `methods: ['Array', 'Union', 'Record', 'Tuple']`, `structural: ['Struct', 'Array', 'Union', 'Record', 'Tuple', 'NullOr', 'UndefinedOr', 'optional', 'TaggedStruct']` |
| `C/*/*.schemas.ts` | also [`arch/effect-schema-first`](../rules/effect-schema-first.md); its lines count against `limits.types` |
| `C/*/*.errors.ts`, `C/*/*.layer.types.ts` | `arch/files-no-functions` |
| `C/*/*.service.ts` | `arch/files-no-functions`; `effecttsgo/lazy-effect` off |
| `C/*/*.constants.ts` | `arch/files-exports` with `patterns: ['{STEM}(?:_[A-Z0-9]+)*']`: `ORDER_LIMIT` in `order.constants.ts` |
| `C/shared/*.ts` | `arch/naming-file`, `arch/naming-folder`, `arch/files-exports` and `arch/files-no-functions` off; `arch/files-constants-only` with `types: true`, `functions: true` |
| `C/contract*.ts` | `arch/files-constants-only` with `types: true`, `functions: true`; `arch/types-imported-alias`; `arch/schemas-single-use` |
| `C/contract.constants.ts` | `arch/files-constants-only` with `reexports: true` |

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

| `effect.errors` option | Default | |
| --- | --- | --- |
| `files` | none | Globs from the package folder for the error class files; they hold exported classes, constants and types named after the file or ending in `Data`, with the tag and code checks below. On a contract package they replace the contract's own `<d>.errors.ts` top level and labels |
| `base` | none | The one file that may call the constructors; without it every `files` match may |
| `constructors` | the four above | The banned constructors; `!name` removes one, a new name adds one |
| `message` | `'Tagged errors live in <d>.errors.ts.'` | The ban's report text |
| `tag` | `'{name}'` | Template the `tag` (and the tag of `Schema.TaggedErrorClass` and the like) must equal |
| `code` | `'^[A-Z][A-Z0-9_]*$'` | Regex a `code` must match; `false` drops the check |

```ts
folders: {
  'packages/contract': { effect: { errors: { constructors: ['!Data.Error', 'Errors.make'], message: 'Errors live in errors files.' } } },
  'packages/contract/src/**/*.errors.ts': { rules: { 'arch/boundaries-deny': 'off' } },
}
```

## What a frontend package gets

A React package (not a framework app) with the `effect` group in either mode and `pages/` or `link.tsx` (or `link.ts`) in its source is a frontend package. Detection adds these keys; `F` is its source. Any React package with `pages/` or a link file, with or without `effect`, gets its `services/` laid out flat when it holds more files than folders.

| Key | Sets |
| --- | --- |
| the unit | `forms: true`; with a contract package, `deny.imports`: `<contract>/*/*.service{,.ts}` (data functions come as props) |
| `F` | [`arch/react-query-props`](../rules/react-query-props.md); `deny.imports`: `@orpc/*`; `no-restricted-imports` with `@tanstack/react-router` (`allowImportNames: ['ClientOnly']`), `next/link`, `next/navigation`, `next/router` and `expo-router`, plus the imports group's patterns |
| `F/link.tsx`, `F/link.ts` | `no-restricted-imports` back to the imports group's setting |
| `F/services/**/*.client.ts` | `arch/backend-service-functions` with `frontend: true` |
| `F/components`, `F/pages` | `deny.calls`: `useContext` (read a context with `use()`), `localStorage.getItem`, `localStorage.setItem`, `sessionStorage.getItem`, `sessionStorage.setItem` |
| `F/components/**/*.tsx` | `arch/files-exports` with `file: '{area}/{name}.tsx'`, `names: ['{Name}']`; `arch/files-top-level`: imports, interfaces, functions named `<Name>…` and an exported `lazy()` constant `<Name>`; `arch/naming-declarations`: interfaces end in `Props` |
| `F/pages/**/*.tsx` | what a component gets from the `react` and `naming` groups (`arch/react-props`, `arch/files-components-only`, `arch/files-helpers`, `arch/naming-folder`, `arch/types-declarations` for `Props` only), plus `arch/files-exports` with `file: '{area}/{name}-page.tsx'`, `names: ['{Name}Page']`; `arch/files-top-level`: imports, interfaces, functions named `<Stem>…`; `arch/naming-declarations`: interfaces end in `Props` |
| `F/pages/**/*.ts` | `arch/files-restricted`: pages are TSX |
| `F/context/*.ts` | `deny.calls`: `useContext`; `arch/files-exports` with `patterns: ['[A-Z]\\w*Context$']` |
| `F/context/**/*.tsx` | `arch/types-declarations` with `allow: 'Props$'` |
| `F/constants/*.constants.ts` | `arch/files-exports`: `ORDER_…` constants or `Order<Name>` values in `order.constants.ts` |

Each key is added only when its folder exists. Write the same key to change one: `'off'` turns a rule off, `false` a `deny` entry.

```ts
folders: {
  'packages/frontend/src': { rules: { 'arch/react-query-props': 'off' } },
  'packages/frontend/src/components': { deny: { calls: { 'localStorage.getItem': false } } },
  'packages/frontend/src/pages/**/*.tsx': { rules: { 'arch/files-top-level': 'off' } },
}
```

## What the web app gets

In a project with a contract package, a TanStack or Next app imports the contract's root entry as types only: `no-restricted-imports` on its source holds `{ name: <contract package>, allowTypeImports: true }` with the imports group's patterns, and a TanStack app keeps its `@tanstack/react-start/rsc` path. Its `services/**/*.rsc.ts` and `*.rsc.tsx` files get the contract path without the rsc one. Subpaths stay free.

## What an Effect module package gets

Off unless a folder sets `effect.module`. One package is one module with a flat source folder; `M` is the module name read from the folder (`kit-wallet` with `'kit-{module}'` is `wallet`), `S` its source, `T` its test folder.

```ts
folders: {
  'packages/*': { effect: { module: 'kit-{module}' } },
  'packages/kit-utils': { effect: { module: 'flat' } },
  'packages/kit-kysely': { effect: { module: { spans: 'database.{method}' } } },
}
```

| Option | Default | |
| --- | --- | --- |
| `name` | `'{module}'` | Folder name template that yields the module name; `'flat'` is one contract or helper per file |
| `kinds` | `types`, `config`, `constants`, `migrations`, `layer`, `fake`, `testing`, `utils`, `handlers`, `middlewares`, `driver`, `adapter`, `index`, `translations-*`, `assets.d` | The `M.<kind>.ts` files allowed; add or remove as in `layout.files`: `['*.policy.ts', '!*.middlewares.ts']` |
| `parts` | `types`, `layer`, `driver`, `fake`, `testing`, `adapter`, `index` | Kinds that may be split as `M-<part>.<kind>.ts`, same syntax |
| `spans` | `'{module}.{method}'` | The `Effect.fn` label in every source file, the module name in camelCase; `false` turns it off |
| `imports` | `true` | Import names: a workspace package as `{Package}`, `{Package}{Subpath}`, `/schema` as `{Package}Types`; a relative file as its name, with `driver`, `adapter` and `index` dropped and a layer as `{File}` or `{File}Layer`. Merged into `naming.imports` |
| `tests` | `{ folder: 'test', support: 'support', factories: 'testing/{module}.factories.ts', fixtures: [] }` | Test, support and factory names and shapes; `false` turns them off. `fixtures` are globs under the test folder for whole framework apps (`['fixtures/{vinext,tanstack}-*']`): their files and folders get `arch/naming-file`, `effecttsgo/async-function`, `linteffect/prevent-dynamic-imports` and `top` off |
| `migrations` | `'{date}-create-{module}-tables'` | Migration file name (and its `.sqlite.ts` twin) in `S/migrations/`; `false` turns it off |

A narrower folder's `module` object merges over the one it inherits, so `{ spans }` on one package keeps the `name` set on `packages/*`.

| Key | Sets |
| --- | --- |
| the package | `types: { placement: false }`; `arch/comments-code` with docblocks on functions; [`arch/code-traced`](../rules/code-traced.md) asks for spans on `S/M.ts`, `S/M.handlers.ts` and `S/M.middlewares.ts` only; `naming.imports` as above |
| `S/**/*.ts` | `arch/naming-file`: `index.ts`, `M.ts`, `M.<kind>.ts`, `M-<part>.<kind>.ts`, a dated migration, and no folder but `migrations/`; `deny.calls`: the `Layer.*` builders; spans; [`arch/effect-yield-name`](../rules/effect-yield-name.md), [`arch/effect-yields-first`](../rules/effect-yields-first.md), `arch/types-inline` with `min: 2`, `arch/types-declarations`, `arch/schemas-local`; `eslint/no-shadow` and `linteffect/prevent-dynamic-imports` off |
| `S/index.ts`, `S/*.index.ts` | `top`: re-exports only; `index.ts` imports no adapter, driver, fake, testing or types file |
| `S/*.config.ts` | `top`: exported constants `config` or `<x>Config` |
| `S/*.constants.ts` | `top`: types and exported `SCREAMING_CASE` constants |
| `S/*.migrations.ts` | `top`: exported `MIGRATIONS` and `SQLITE_MIGRATIONS` |
| `S/*.types.ts` | Schemas first with `keep: 'Table$'` and `rows`; exports start with the module's PascalCase name, tables singular; it re-exports only `M-<part>.types.ts`, and with part files beside it holds nothing else |
| `S/*.layer.ts`, `S/*.driver.ts`, `S/*.fake.ts` | exports `layer` only; [`arch/effect-layer-file`](../rules/effect-layer-file.md); the `Layer.*` builders are allowed |
| `S/*.driver.ts` | imports no other driver, except in `*-config.driver.ts` |
| `S/*.adapter.ts` | exports start with the file name; imports no layer, driver or fake; `*-react.adapter.ts` may hold React state |
| `S/migrations/*.ts` | the migration file name |
| index, config, constants, migrations, types and `.d.ts` files | no docblocks |
| `T/**` | function nesting up to 5; `linteffect/no-service-layer-scatter` off |
| `T/*.ts` | `M[-<part>][.<what>].test.ts`, `.bench.ts`, `.suite.ts` or `M.types.ts`; never `.integration` |
| `T/*.test.ts` | `top`: `describe*`, `it*`, `layer`, `*Suite` and `*.describe` calls |
| `T/*.<kind>.test.ts` | [`arch/files-siblings`](../rules/files-siblings.md): `S/M.<kind>.ts` exists, for layer, fake, adapter, utils, handlers, middlewares, testing and driver |
| `T/support/*.ts` | `M.{layer,cases,scenarios}.ts`, `M-<part>.{cases,scenarios}.ts` or `M-<api>.ts`; no types; a layer constant is `<Role>Layer` |
| `T/**/*.bench.ts` | assertion and runtime-boundary rules off |
| the factories folder | one file, exported `…Factory` constants only |

A flat package gets the package row, the `S/**/*.ts` row without the file-name, types and Schema rules, spans named after the file (`{stem}.{method}`), `S/index.ts` and the test rows without the name rules.

With `effect.errors: { files: 'src/errors/*.ts', base: 'src/errors/tagged.ts' }` the listed files hold exported classes, constants and types named after the file or ending in `Data`, an error's `tag` is its class name and its `code` is `SCREAMING_CASE`; only `base` may call `Schema.TaggedError`, `Schema.ErrorClass`, `Data.TaggedError` and `Data.Error`.

Restate any key to change one rule:

```ts
folders: {
  'packages/*/test/*.test.ts': { top: ['describe*', 'it*', 'bench'] },
  'packages/kit-kysely/src/*.ts': { rules: { 'arch/types-unknown': 'off' } },
}
```

## What a UI kit gets

A UI kit (`kit` on) with the `effect` group in either mode bans `<name>` and `<name>/**` of every other workspace package that is not a UI kit: "A UI kit imports no app package." Drop one with `false` under `deny.imports`.
