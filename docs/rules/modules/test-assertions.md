# `modules/test-assertions`

Preset-internal rule: every test case must contain a recognized assertion, and `expect` calls must sit inside a test or assertion helper.

## Why

Native Vitest `expect-expect` / `no-standalone-expect` checks cannot follow fixture and table-row callbacks. This rule does. It follows called local helpers and statically declared object table rows, including destructured or renamed callbacks, and requires an assertion for every row. Unused assertion callbacks do not count. Assertions outside tests or assertion helpers are errors.

This is a static check, not proof that every execution path reaches an assertion. Imported callbacks, dynamically constructed tables and cross-file helper bodies are not inferred. Register only assertion helpers that fail on incorrect results.

## Examples

❌ Incorrect

```ts
import { test as base } from 'vitest'

const test = base.extend({ amount: 1 })

test.for([1])('checks %s', (amount) => {
  Math.abs(amount)
})

expect(1).toBe(1)
```

✅ Correct

```ts
import { expect, test as base } from 'vitest'

const test = base.extend({ amount: 1 })

test.for([1])('checks %s', (amount) => {
  expect(amount).toBe(1)
})

test('value', () => {
  check()
})
function check() {
  expect(1).toBe(1)
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `additionalTestFunctions` | `string[]` | `[]` | Extra test names (`test` and `it` are always included). Must be literal identifiers or dotted names. Also registers `.for` / `.each` forms. |
| `additionalAssertionFunctions` | `string[]` | `[]` | Extra assertion names or rooted dotted patterns, for example `arch.**.to*`. |

Built-in assertions: `expect`, `expect.poll`, `expect.soft`, `expect.assert`, `expect.assertions`, `expect.hasAssertions`, `expectTypeOf`, `assert`, `assertType`, and `assert.*`.

```ts
// oxlint.config.ts
rules: {
  'modules/test-assertions': ['error', {
    additionalTestFunctions: ['integrationTest'],
    additionalAssertionFunctions: ['expectRejectsWithInternal'],
  }],
}
```

The preset also accepts these through `tests.additionalTestFunctions` and `tests.additionalAssertionFunctions`.

## Preset

Preset: `tests` policy, on `**/{test,tests,e2e}/**/*.{ts,tsx}` and `*.{test,spec}.{ts,tsx}`.

## Related

- [`modules/test-modifiers`](./test-modifiers.md)
- [`modules/concurrent-db`](./concurrent-db.md)
