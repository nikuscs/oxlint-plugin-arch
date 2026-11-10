# arch/tests-concurrent-db

Reports a `db` fixture (or any name in `fixtures`) destructured from a `test.concurrent` callback's context (or any callee in `callees`), in its parameter or its body, by identifier or string key.

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
| `fixtures` | `string[]` | `['db']` | Shared fixture names a concurrent test must not destructure |
| `callees` | `string[]` | `['test.concurrent']` | Dotted callees that run their callback concurrently |

```ts
'arch/tests-concurrent-db': ['error', { message: 'Obtain an isolated database fixture for concurrent tests.' }]
'arch/tests-concurrent-db': ['error', { fixtures: ['db', 'sql'], callees: ['test.concurrent', 'it.concurrent'] }]
```
