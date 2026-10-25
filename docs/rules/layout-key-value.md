# arch/layout-key-value

An object property whose value starts on a later line than its key.

```ts
// ❌
const user = {
  name:
    'Ada',
}

// ✅
const user = {
  name: 'Ada',
}
```

```ts
'arch/layout-key-value': 'error'
```
