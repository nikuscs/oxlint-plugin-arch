# Tests

Back to the [preset overview](README.md).

```ts
tests: {
  profile: 'fixtures', // or 'standard'
  additionalTestFunctions: ['integrationTest'],
  additionalAssertionFunctions: ['expectRejectsWithInternal', 'arch.**.to*'],
}
```

| Option | Default | What it does |
| --- | --- | --- |
| `profile` | `'fixtures'` | `fixtures`: backend tests import named fixtures or `tests/support`, not `tests/helpers`. `standard`: helper folders are free. |
| `additionalTestFunctions` | `[]` | Extra test functions. Identifiers or dotted names. `.each`, `.for`, `.concurrent` forms are registered too. |
| `additionalAssertionFunctions` | `[]` | Extra assertion helpers. Dotted names or rooted patterns (`arch.**.to*`). Register only helpers that really fail. |

Both profiles apply the same assertion, typed-mock, type-safety and no-module-mocking rules. Neither picks a database or test kit.

## Assertions

[`modules/test-assertions`](../rules/modules/test-assertions.md) replaces `vitest/expect-expect` and `vitest/no-standalone-expect`.

- Every test and every table row needs an assertion. Local helpers and destructured callbacks are followed.
- `expect` outside a test or assertion helper fails.
- Imported callbacks, dynamic tables and helpers in other files are not followed. Assert directly or register the helper.
- Built-in: `expect`, `expectTypeOf`, `assert`, `assert.*`, `assertType`.

Narrow results with `assert`, not conditional `expect`:

```ts
// ❌
if (result.ok) expect(result.data.ordersCreated).toBe(1)

// ✅
assert(result.ok, 'Expected the operation to succeed')
expect(result.data.ordersCreated).toBe(1)
```

Change scoped options through `policies.tests`.
