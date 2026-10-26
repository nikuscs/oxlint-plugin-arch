# arch/react-dynamic-classes

Reports template literals with expressions and `+` concatenation inside `className`.

```tsx
// ❌
<button className={`btn-${size}`} />

// ✅
<button className={size === 'lg' ? 'btn-lg' : 'btn-sm'} />
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | built-in text | Report text |

```ts
'arch/react-dynamic-classes': ['error', { message: 'Write complete class names instead of constructing them...' }]
```
