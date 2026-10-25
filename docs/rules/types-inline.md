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
| `functionTypes` | `boolean` | `true` | Also report inline function types |
| `minMembers` | `number` | `1` | Smallest object literal type to report |

```ts
'arch/types-inline': ['error', { minMembers: 2, functionTypes: false }]
```
