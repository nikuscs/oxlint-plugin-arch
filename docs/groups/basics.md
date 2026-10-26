# 🧹 basics

Small code habits. On by default.

```ts
folders: {
  'apps/web': { basics: { switch: false } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `trivial` | `boolean` | `true` | Pass-through helpers |
| `state` | `boolean` | `true` | Module-level `let`/`var` |
| `switch` | `boolean` | `true` | `switch` in backend code |
| `negation` | `boolean` | `true` | `!!value` |

Rules: [`arch/code-double-negation`](../rules/code-double-negation.md), [`arch/code-mutable-state`](../rules/code-mutable-state.md), [`arch/code-switch`](../rules/code-switch.md), [`arch/code-trivial-functions`](../rules/code-trivial-functions.md).
