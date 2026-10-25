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

Rules: [`arch/files-route`](../rules/files-route.md).
