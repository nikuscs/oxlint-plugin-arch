# 🧪 tests

Test structure, assertions and mocking. On by default.

```ts
folders: {
  'apps/web': { tests: { assertions: ['arch.**.to*'], mocking: 'strict' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `assertions` | `string[]` | `[]` | Extra assertion helpers, e.g. `arch.**.to*` |
| `functions` | `string[]` | `[]` | Extra test functions |
| `mocking` | `'modules' \| 'strict' \| object` | `'modules'` | `strict` also bans spies and stubs |
| `titles` | `boolean` | `true` | No "should" titles |
| `fixtures` | `boolean` | `true` | Backend tests use named fixtures, not `helpers/` |

Rules: [`arch/tests-assertions`](../rules/tests-assertions.md), [`arch/tests-concurrent-db`](../rules/tests-concurrent-db.md), [`arch/tests-modifiers`](../rules/tests-modifiers.md), [`arch/tests-titles`](../rules/tests-titles.md), [`dillon-anti-slop/no-module-mocking`](../vendor.md#no-module-mocking).

Plus `eslint` (1), `jest` (6), `vitest` (2).
