# ⚛️ react

React components, hooks and effects. Opt-in.

```ts
folders: {
  'apps/web': { react: { a11y: false } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `a11y` | `boolean` | `true` | jsx-a11y rules |
| `effects` | `boolean` | `true` | "You might not need an effect" rules |
| `props` | `boolean` | `true` | `interface <Name>Props` above the component |
| `compiler` | `boolean` | `true` | React Compiler: ban manual memo |
| `memo` | `boolean` | = compiler | Ban `memo`/`useMemo`/`useCallback` |
| `perf` | `boolean` | = !compiler | react-perf prop rules |

Rules: [`arch/boundaries-token-owner`](../rules/boundaries-token-owner.md), [`arch/files-helpers`](../rules/files-helpers.md), [`arch/layout-jsx-attributes`](../rules/layout-jsx-attributes.md), [`arch/react-empty-effect`](../rules/react-empty-effect.md), [`arch/react-memo`](../rules/react-memo.md), [`arch/react-props`](../rules/react-props.md).

Plus `jsx-a11y` (35), `react` (11), `react-extra` (14), `react-perf` (4), `react-you-might-not-need-an-effect` (8), `svg-jsx` (2).
