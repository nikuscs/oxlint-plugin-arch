# arch/layout-call-depth

Calls nested more than `max` deep on one line. Only the outermost call reports, and a callback starts a new count unless `callbacks` is on. A call without arguments does not add a level.

No fix. A call that already spans lines is skipped.

```ts
// ❌
save(run(load(id)))

// ✅
const user = load(id)
save(run(user))

// ✅ default: the callback starts a new count
x(run(() => y(z(1))))

// ❌ callbacks: true
x(run(() => y(z(1))))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `2` | Deepest nesting allowed on one line |
| `callbacks` | `boolean` | `false` | Count through inline callbacks instead of starting a new count in each |

```ts
'arch/layout-call-depth': ['error', { max: 2 }]
'arch/layout-call-depth': ['error', { max: 2, callbacks: true }]
```
