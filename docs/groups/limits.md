# 📏 limits

File length and function complexity. On by default.

```ts
folders: {
  'apps/web': { limits: { lines: 300 } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `lines` | `number` | `2000` | Max lines per file |
| `types` | `number` | `2000` | Max lines per `*.types.ts` and `*.schemas.ts` |
| `complexity` | `number` | `32` | Max cyclomatic complexity |

Plus `eslint` (2).
