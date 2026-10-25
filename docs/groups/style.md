# 🎨 style

Quotes, semicolons, spacing and statement layout. On by default.

```ts
folders: {
  'apps/web': { style: { semicolons: false } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `quotes` | `'single' \| 'double'` | `'single'` |  |
| `semicolons` | `boolean` | `true` |  |
| `multiline` | `boolean` | `true` | Objects, `Promise.all` arrays, key/value layout |
| `padding` | `boolean` | `true` | Blank lines between statements |

Rules: [`arch/layout-call-array`](../rules/layout-call-array.md), [`arch/layout-key-value`](../rules/layout-key-value.md), [`arch/layout-object`](../rules/layout-object.md), [`arch/layout-padding`](../rules/layout-padding.md).

Plus `eslint-js` (32).
