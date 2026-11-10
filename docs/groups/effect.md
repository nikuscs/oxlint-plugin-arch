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
| `width` | `number` | `160` | Line width for the layout rules and `code-inline` |
| `exports` | `string \| string[]` | | Regex for files whose exports `code-traced` checks; every non-test file when unset |
| `skip` | `string \| string[]` | | Regex for service names `code-traced` skips, such as `Driver$` |
| `entries` | `string[]` | `[]` | Globs for entry files (servers, Workers, scripts) that provide their own layers |

It turns off [`arch/code-trivial-functions`](../rules/code-trivial-functions.md), which reports an Effect function written as one pipe.

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
