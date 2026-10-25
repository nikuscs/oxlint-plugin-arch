# arch/tests-assertions

Reports tests with no recognized assertion and `expect` calls outside any test or helper.

```ts
// ❌
test('saves the user', async () => {
  await save(user)
})

// ✅
test('saves the user', async () => {
  expect(await save(user)).toEqual({ ok: true })
})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `functions` | `string[]` | `[]` | Extra test registration names besides `test` and `it` |
| `assertions` | `string[]` | `[]` | Extra assertion names; `*` and `**` wildcards |

```ts
'arch/tests-assertions': ['error', { assertions: ['expectUser'] }]
```
