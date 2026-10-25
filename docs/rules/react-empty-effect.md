# arch/react-empty-effect

Reports `useEffect` and `useLayoutEffect` calls whose callback body is empty.

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
| `message` | `string` | built-in text | Report text |

```ts
'arch/react-empty-effect': ['error', { message: 'Remove the empty effect.' }]
```
