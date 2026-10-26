# 💨 tailwind

Tailwind class checks against your stylesheet. Opt-in.

Needs `bun add -d oxlint-tailwindcss`.

```ts
folders: {
  'apps/web': { tailwind: { css: 'apps/web/src/styles.css' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `css` | `string` | detected | Stylesheet, root-relative. Default: the folder's stylesheet with `@import "tailwindcss"` or `@tailwind`, preferring `styles`, `globals`, `global`, `app`, `index`, `main`, `style`, `tailwind`. A kit without one uses the stylesheet of the app that depends on it, else the first app's |
| `rem` | `number` | `16` | Root font size; project-wide, so every folder must agree |

Plus `tailwindcss` (8).
