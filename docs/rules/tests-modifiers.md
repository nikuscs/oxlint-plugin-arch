# arch/tests-modifiers

Reports `.only`, `.skip` and `.todo` (or the names in `modifiers`) on `test`, `it`, `describe` and `suite`, including after `skipIf()`, `runIf()` and `if()`, and later in a chain (`test.concurrent.only`). Renamed imports from `vitest`, `bun:test`, `@playwright/test` and `@jest/globals` are tracked.

```ts
// ❌
test.only('saves the user', () => {})

// ✅
test('saves the user', () => {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `functions` | `string[]` | `[]` | Extra test function names, dotted allowed |
| `modifiers` | `string[]` | `['only', 'skip', 'todo']` | Modifiers to report; replaces the default list |

```ts
'arch/tests-modifiers': ['error', { functions: ['bench'] }]
'arch/tests-modifiers': ['error', { modifiers: ['only'] }]
```
