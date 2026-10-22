# `modules/test-modifiers`

Preset-internal rule: reject focused, skipped and placeholder tests, including renamed imports such as `check.only`.

## Why

`only`, `skip` and `todo` on `test`, `it`, `describe`, `suite` and configured extra names are errors. Specifiers imported as `test` / `it` / `describe` / `suite` from `vitest`, `bun:test`, `@playwright/test` or `@jest/globals` are tracked under their local name. Unrelated `.skip()` calls are left alone.

## Examples

❌ Incorrect

```ts
import { test } from 'vitest'

test.only('unfinished')
```

```ts
import { test as check } from 'vitest'
check.only('works', () => {})
```

✅ Correct

```ts
import { test as check } from 'vitest'
check('works', () => {})
```

```ts
import { test, expect } from 'vitest'
test('runs', () => {
  expect(1).toBe(1)
})
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `additionalTestFunctions` | `string[]` | `[]` | Extra roots such as `integrationTest` or `suite.integration`. |

```ts
// oxlint.config.ts
rules: {
  'modules/test-modifiers': ['error', {
    additionalTestFunctions: ['integrationTest'],
  }],
}
```

The preset also accepts this through `tests.additionalTestFunctions`.

## Preset

Preset: `tests` policy, on `**/{test,tests,e2e}/**/*.{ts,tsx}` and `*.{test,spec}.{ts,tsx}`.

## Related

- [`modules/test-assertions`](./test-assertions.md)
- [`modules/concurrent-db`](./concurrent-db.md)
