# arch/layout-call-depth

Calls nested more than `max` deep on one line. Only the outermost call reports, and a callback starts a new count.

```ts
// ❌
save(run(load(id)))

// ✅
const user = load(id)
save(run(user))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `2` | Deepest nesting allowed on one line |

```ts
'arch/layout-call-depth': ['error', { max: 2 }]
```
