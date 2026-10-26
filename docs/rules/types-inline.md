# arch/types-inline

Reports inline object and function types in parameter and return annotations.

```ts
// ❌
function save(user: { id: string }): { ok: boolean } {}

// ✅
function save(user: User): SaveResult {}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `parameters` | `boolean` | `true` | Check parameter annotations |
| `returns` | `boolean` | `true` | Check return annotations |
| `functions` | `boolean` | `true` | Also report inline function types |
| `min` | `number` | `1` | Smallest object literal type to report |

```ts
'arch/types-inline': ['error', { min: 2, functions: false }]
```
