# ⚛️ react

React components, hooks and effects. Opt-in.

Needs `bun add -d eslint-plugin-react eslint-plugin-react-you-might-not-need-an-effect eslint-plugin-svg-jsx`.

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

In a web app and in a React package that is not a UI kit, `createContext` lives in `context/` (or the UI folder); with [`layout`](layout.md), components are TSX and hooks are `.ts` files in `hooks/`. With [`naming`](naming.md), a hook file `use-<name>.ts` (or `use-<name>.<platform>.ts`) exports `use<Name>`; in a UI kit `use<Name>` or `useIs<Name>`, so shadcn's `use-mobile.ts` keeps `useIsMobile`. Setting `layout: false` keeps the naming checks.

Rules: [`arch/boundaries-token-owner`](../rules/boundaries-token-owner.md), [`arch/files-helpers`](../rules/files-helpers.md), [`arch/layout-jsx-attributes`](../rules/layout-jsx-attributes.md), [`arch/react-empty-effect`](../rules/react-empty-effect.md), [`arch/react-memo`](../rules/react-memo.md), [`arch/react-props`](../rules/react-props.md).

Plus `jsx-a11y` (35), `react` (11), `react-extra` (14), `react-perf` (4), `react-you-might-not-need-an-effect` (8), `svg-jsx` (2).
