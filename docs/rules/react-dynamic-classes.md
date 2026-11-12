# arch/react-dynamic-classes

Reports template literals with expressions and `+` concatenation inside `className`, or the attributes in `attributes`, anywhere inside the attribute value, including inside `clsx(...)`.

```tsx
// ❌
<button className={`btn-${size}`} />

// ✅
<button className={size === 'lg' ? 'btn-lg' : 'btn-sm'} />
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `attributes` | `string[]` | `['className']` | JSX attributes to check; replaces the default |
| `message` | `string` | `'Write complete class names instead of constructing them dynamically.'` | Report text |

```ts
'arch/react-dynamic-classes': ['error', { attributes: ['className', 'class'] }]
```
