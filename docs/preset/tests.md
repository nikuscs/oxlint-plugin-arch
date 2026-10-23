# Tests

Back to the [preset overview](README.md).

```ts
tests: {
  profile: 'fixtures', // or 'standard'
  additionalTestFunctions: ['integrationTest'],
  additionalAssertionFunctions: ['expectRejectsWithInternal', 'arch.**.to*'],
  mocking: 'modules', // or 'strict', or an object, see Mocking
}
```

| Option | Default | What it does |
| --- | --- | --- |
| `profile` | `'fixtures'` | `fixtures`: backend tests import named fixtures or `tests/support`, not `tests/helpers`. `standard`: helper folders are free. |
| `additionalTestFunctions` | `[]` | Extra test functions. Identifiers or dotted names. `.each`, `.for`, `.concurrent` forms are registered too. |
| `additionalAssertionFunctions` | `[]` | Extra assertion helpers. Dotted names or rooted patterns (`arch.**.to*`). Register only helpers that really fail. |
| `mocking` | `'modules'` | Which test-double APIs are banned in test files. See [mocking](#mocking). |

Both profiles apply the same assertion, typed-mock, type-safety and mocking rules. Neither picks a database or test kit.

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

## Mocking

`tests.mocking` sets which `vi` and `jest` APIs [`dillon-anti-slop/no-module-mocking`](../rules/dillon-anti-slop/no-module-mocking.md) bans in test files of every root. Use it to make tests inject fake drivers instead of stubbing.

| Preset | Banned (`vi` and `jest`) | Allowed by default |
| --- | --- | --- |
| `'modules'` (default) | `mock`, `doMock`, `unstable_mockModule` | none |
| `'strict'` | the above plus `spyOn`, `stubGlobal`, `stubEnv` | every API in `**/*.driver.test.ts` |

`'strict'` reports with a message that asks for a fake driver. `fn` is never banned, because fakes use it.

```ts
tests: {
  mocking: {
    preset: 'strict',
    deny: ['vi.useFakeTimers'],
    allow: [{ files: ['apps/web/tests/**'], apis: ['vi.stubGlobal'] }],
  },
}
```

| Key | Default | What it does |
| --- | --- | --- |
| `preset` | `'modules'` | Base list. A string `mocking: 'strict'` is short for `{ preset: 'strict' }`. |
| `deny` | `[]` | APIs added to the preset list: `'vi.*'`, `'jest.spyOn'` or `{ api, message }`. |
| `allow` | `[]` | Per-file exceptions added after the preset's own. `apis: ['*']` turns the rule off for those files. |

- API patterns are `<vi|jest|*>.<method|*>`, or `*` for every API. Other values throw.
- `'strict'` and any extra `deny` also catch calls through destructured bindings, such as `const { spyOn } = vi`. `let` and `var` bindings are skipped.
- Your `deny` entries come before the preset's, so your `message` wins for an API in both lists.
- Each `allow` entry is its own override. Entries with `apis: ['*']`, the preset's driver entry included, go last, so a file they match is always exempt. When two entries with specific APIs match one file, the later one replaces the earlier one; the lists do not merge. List both APIs in one entry when you need both.
- Point `allow` files at test files. An entry with specific APIs turns the rule on for every file it matches.

Change scoped options through `policies.tests`.
