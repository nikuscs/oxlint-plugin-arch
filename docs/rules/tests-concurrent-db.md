# arch/tests-concurrent-db

Reports a `db` fixture destructured in a `test.concurrent` callback.

```ts
// ❌
test.concurrent('saves the user', async ({ db }) => {
  await db.insert(user)
})

// ✅
test.concurrent('saves the user', async ({ isolatedDb }) => {
  await isolatedDb.insert(user)
})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `message` | `string` | built-in text | Report text |

```ts
'arch/tests-concurrent-db': ['error', { message: 'Obtain an isolated database fixture for concurrent tests.' }]
```
