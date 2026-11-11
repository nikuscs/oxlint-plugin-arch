# arch/types-inline

Reports inline object and function types in parameter and return annotations, and optionally in variable annotations, assertions and type arguments.

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
| `variables` | `boolean` | `false` | Check variable and class property annotations |
| `assertions` | `boolean` | `false` | Check `as` and `satisfies` types |
| `arguments` | `boolean` | `false` | Check type arguments of calls and `new` |
| `min` | `number` | `1` | Smallest object literal type to report |

```ts
'arch/types-inline': ['error', { min: 2, functions: false }]
'arch/types-inline': ['error', { variables: true, assertions: true, arguments: true }]
```
