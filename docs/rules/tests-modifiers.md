# arch/tests-modifiers

Reports `.only`, `.skip` and `.todo` on `test`, `it`, `describe` and `suite`, including after `skipIf()`, `runIf()` and `if()`.

```ts
// ❌
test.only('saves the user', () => {})

// ✅
test('saves the user', () => {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `functions` | `string[]` | `[]` | Extra test function names |

```ts
'arch/tests-modifiers': ['error', { functions: ['bench'] }]
```
