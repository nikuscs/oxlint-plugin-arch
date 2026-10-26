# arch/code-switch

A `switch` statement.

```ts
// ❌
switch (event.type) {
  case 'created':
    return onCreated(event)
}

// ✅
return match(event)
  .with({ type: 'created' }, onCreated)
  .exhaustive()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | `'Avoid switch statements.'` | Report text |

```ts
'arch/code-switch': ['error', { message: 'Use ts-pattern.' }]
```
