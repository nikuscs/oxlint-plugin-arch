# 📱 expo

Expo Router screens and API routes. Opt-in.

```ts
folders: {
  'apps/mobile': { expo: { server: ['node:fs'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `server` | `string[]` | `[]` | Imports banned in the app |

Route files under `app/` are kebab-case, `_layout`, `index`, `[param]`, `[...rest]` or `+special`, and hold only screens, their components and `makeStyles`. The DOM SVG rules (`svg-jsx/*`) are off: React Native and Skia use `style` for their own values.

Rules: [`arch/files-helpers`](../rules/files-helpers.md), [`arch/files-route`](../rules/files-route.md), [`arch/naming-file`](../rules/naming-file.md).
