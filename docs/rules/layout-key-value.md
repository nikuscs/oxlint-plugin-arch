# arch/layout-key-value

An object property whose value starts on a later line than its key.

The fix joins the value onto the key line. A comment or a parenthesized value is reported without a fix. Destructuring, methods and getters are skipped.

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
