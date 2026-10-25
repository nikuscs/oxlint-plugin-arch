# arch/files-restricted

Reports every file it runs on with your `message`; scope it to the paths that must stay empty.

```ts
// ❌ src/legacy/api.ts
export const api = {}

// ✅ src/api/client.ts
export const api = {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | required | Report text |

```ts
'arch/files-restricted': ['error', { message: 'Legacy code is frozen; add new code under src/api.' }]
```
