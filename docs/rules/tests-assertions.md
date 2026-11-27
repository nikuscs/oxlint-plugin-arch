# arch/tests-assertions

Reports tests with no recognized assertion and `expect` calls outside any test or helper. Renamed `test`, `it` and assertion imports from `vitest`, `bun:test`, `@jest/globals` and `@playwright/test` are tracked.

Recognized by default: `expect`, `expect.poll`, `expect.soft`, `expect.assert`, `expect.assertions`, `expect.hasAssertions`, `expectTypeOf`, `assert`, `assert.*`, `assertType`. A helper declared in the file that asserts counts when the test calls it; an imported helper must be listed in `assertions`. In a `test.each`/`test.for` table, every row must reach an assertion. `test.todo` without a callback passes. Names in `functions`, like `bench`, register tests, and the modifiers `each`, `for`, `concurrent`, `sequential`, `only`, `skip`, and `@effect/vitest`'s `effect` and `live` are followed.

`max` and `last` count the recognized assertion calls (one per `expect(…)` chain) written in the test itself, not in helpers. A test that returns `Effect.gen(function* () { … })`, piped or not, is read inside the generator. A test with no assertion reports only as missing.

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
| `max` | `integer` | none | Most assertions one test makes |
| `last` | `boolean` | `false` | The last statement of a test holds its assertion |

```ts
'arch/tests-assertions': ['error', { assertions: ['expectUser'] }]
'arch/tests-assertions': ['error', { assertions: ['arch.**.to*'] }]
'arch/tests-assertions': ['error', { max: 1, last: true }]
```
