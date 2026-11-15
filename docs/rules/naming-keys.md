# arch/naming-keys

Reports a value bound under an object key when its name does not follow the key path.

```ts
// callees: ['Domain.bind'], name: '^{folder}(?:Action|Query){Path}$'
// ❌ order/order.layer.ts
Domain.bind({ schedule: { cancel: Actions.orderActionCancel } })

// ✅
Domain.bind({ schedule: { cancel: Actions.orderActionScheduleCancel } })
```

The first object argument of each listed call is read, nested objects too. A value is checked when it is a name or a member (`Actions.orderActionCreate` is read as `orderActionCreate`); inline functions, calls, spreads and computed keys are skipped.

`{Path}` is the key path in PascalCase (`schedule.cancel` gives `ScheduleCancel`), `{path}` in camelCase. `{folder}`, `{parent}`, `{stem}` and `{file}` come from the file path.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `callees` | `string[]` | required | Dotted callee names whose object is checked; `*` is any text (`*.of`) |
| `name` | `string \| string[]` | required | Regexes the bound name must match, with placeholders |

```ts
'arch/naming-keys': ['error', { callees: ['Domain.bind'], name: '^{folder}(?:Action|Query){Path}$' }]
```
