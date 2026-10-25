# 💨 tailwind

Tailwind class checks against your stylesheet. Opt-in.

```ts
folders: {
  'apps/web': { tailwind: { css: 'apps/web/src/styles.css' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `css` | `string` | `src/application/styles.css` (Next: `src/app/globals.css`) | Stylesheet, root-relative |
| `rem` | `number` | `16` | Root font size |

Plus `tailwindcss` (8).
