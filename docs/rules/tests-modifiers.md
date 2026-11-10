# arch/tests-modifiers

Reports `.only`, `.skip` and `.todo` (or the names in `modifiers`) on `test`, `it`, `describe` and `suite`, including after `skipIf()`, `runIf()` and `if()`.

```ts
// ❌
test.only('saves the user', () => {})

// ✅
test('saves the user', () => {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `functions` | `string[]` | `[]` | Extra test function names |
| `modifiers` | `string[]` | `['only', 'skip', 'todo']` | Modifiers to report; replaces the default list |

```ts
'arch/tests-modifiers': ['error', { functions: ['bench'] }]
'arch/tests-modifiers': ['error', { modifiers: ['only'] }]
```
