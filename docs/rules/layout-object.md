# arch/layout-object

One property per line once a single-line object has `minProperties`.

```ts
// ❌
save({ id, name, email })

// ✅
save({
  id,
  name,
  email,
})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `minProperties` | `number` | `3` | Smallest object that must break |
| `scope` | `'call-args' \| 'all'` | `'call-args'` | Only call arguments, or every object |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

```ts
'arch/layout-object': ['error', { minProperties: 3, scope: 'all' }]
```
