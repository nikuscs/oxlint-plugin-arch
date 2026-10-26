# arch/layout-jsx-attributes

Every attribute and the closing `>` or `/>` on its own line once a single-line JSX tag has `min` attributes.

```tsx
// ❌
const button = <Button size="sm" variant="ghost" onClick={close} />

// ✅
const button = (
  <Button
    size="sm"
    variant="ghost"
    onClick={close}
  />
)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `3` | Smallest tag that must break |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

```ts
'arch/layout-jsx-attributes': ['error', { min: 3 }]
```
