# arch/code-yield-argument

A `yield*` passed straight into a call or used as a receiver. A plain `yield` is not reported.

```ts
// ❌
save(yield* load())

// ✅
const user = yield* load()
save(user)
```

No options.

```ts
'arch/code-yield-argument': 'error'
```
