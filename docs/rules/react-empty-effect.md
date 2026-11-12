# arch/react-empty-effect

Reports `useEffect` and `useLayoutEffect` calls whose callback body is empty. A body with only comments is empty; an expression body or a referenced function is not.

```tsx
// ❌
useEffect(() => {}, [])

// ✅
useEffect(() => {
  track(page)
}, [page])
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `hooks` | `string[]` | `['useEffect', 'useLayoutEffect', 'React.useEffect', 'React.useLayoutEffect']` | Dotted callee names of effect hooks; replaces the default list |
| `message` | `string` | `'Remove the empty effect.'` | Report text |

```ts
'arch/react-empty-effect': ['error', { hooks: ['useEffect', 'createEffect'] }]
```
