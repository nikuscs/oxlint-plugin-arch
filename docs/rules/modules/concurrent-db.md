# `modules/concurrent-db`

Preset-internal syntax rule: concurrent tests must not destructure a `db` fixture. Use an isolated database fixture instead.

## Why

Selector: `test.concurrent(...)` whose callback destructures a property named `db`. Message: `Obtain an isolated database fixture for concurrent tests.` Shared `db` handles are not safe across concurrent cases.

## Examples

❌ Incorrect

```ts
import { test } from 'vitest'

test.concurrent('queries', ({ db }) => {
  db.query()
})
```

✅ Correct

```ts
import { test, expect } from 'vitest'

test.concurrent('owns a database', ({ database }) => {
  expect(database).toBeDefined()
})
```

## Options

This rule has no options.

## Preset

Preset: `tests` policy, on backend `tests/**/*.ts`.

## Related

- [`modules/test-assertions`](./test-assertions.md)
- [`modules/test-modifiers`](./test-modifiers.md)
