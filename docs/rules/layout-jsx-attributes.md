# arch/layout-jsx-attributes

Every attribute and the closing `>` or `/>` on its own line once a single-line JSX tag has `min` attributes. With `join`, a split tag with fewer than `min` attributes goes back on one line.

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
| `join` | `{ max }` | | A split tag with fewer than `min` attributes goes on one line when it fits in `max` columns, every attribute is one line, its name and type arguments are one line and it has no comments |

```tsx
// ❌ join
const button = (
  <Button
    size="sm"
    onClick={close}
  />
)

// ✅ join
const button = <Button size="sm" onClick={close} />
```

```ts
'arch/layout-jsx-attributes': ['error', { min: 3 }]
'arch/layout-jsx-attributes': ['error', { min: 3, join: { max: 160 } }]
```
