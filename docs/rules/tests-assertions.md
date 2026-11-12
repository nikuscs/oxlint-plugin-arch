# arch/tests-assertions

Reports tests with no recognized assertion and `expect` calls outside any test or helper. Renamed `test`, `it` and assertion imports from `vitest`, `bun:test`, `@jest/globals` and `@playwright/test` are tracked.

Recognized by default: `expect`, `expect.poll`, `expect.soft`, `expect.assert`, `expect.assertions`, `expect.hasAssertions`, `expectTypeOf`, `assert`, `assert.*`, `assertType`. A helper declared in the file that asserts counts when the test calls it; an imported helper must be listed in `assertions`. In a `test.each`/`test.for` table, every row must reach an assertion. `test.todo` without a callback passes. Names in `functions`, like `bench`, register tests, and the modifiers `each`, `for`, `concurrent`, `sequential`, `only` and `skip` are followed.

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
| `assertions` | `string[]` | `[]` | Extra assertion names; `*` matches one name segment, `**` any number (`arch.**.to*`) |

```ts
'arch/tests-assertions': ['error', { assertions: ['expectUser'] }]
'arch/tests-assertions': ['error', { assertions: ['arch.**.to*'] }]
```
