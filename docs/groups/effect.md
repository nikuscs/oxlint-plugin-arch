# ⚡ effect

Layout and code rules for Effect code. Opt-in.

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

It turns off [`arch/code-trivial-functions`](../rules/code-trivial-functions.md), which reports an Effect function written as one pipe.

Rules: [`arch/code-branch-once`](../rules/code-branch-once.md), [`arch/code-function-nesting`](../rules/code-function-nesting.md), [`arch/code-inline`](../rules/code-inline.md), [`arch/code-justified-call`](../rules/code-justified-call.md) for `Effect.promise` and [`arch/code-traced`](../rules/code-traced.md) outside tests, [`arch/code-yield-argument`](../rules/code-yield-argument.md), [`arch/layout-arrow-body`](../rules/layout-arrow-body.md), [`arch/layout-call-arguments`](../rules/layout-call-arguments.md) with `hug` and `join`, [`arch/layout-call-depth`](../rules/layout-call-depth.md), [`arch/layout-items`](../rules/layout-items.md), [`arch/layout-pipe`](../rules/layout-pipe.md), [`arch/layout-ternary`](../rules/layout-ternary.md) with `branch`.
