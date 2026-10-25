# 🧱 shadcn

shadcn/ui usage: no restyling, no arbitrary values. Opt-in.

Needs `bun add -d @shadcn/lint`.

```ts
folders: {
  'apps/web': { shadcn: { ui: '@acme/ui' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `ui` | `string` | `'@/components/ui'` | UI import path |
| `components` | `string[]` | `['^@/components/']` | Component import patterns |

Rules: [`arch/react-dynamic-classes`](../rules/react-dynamic-classes.md).

Plus `shadcn` (4).
