# arch/tests-modifiers

Reports `.only`, `.skip` and `.todo` on `test`, `it`, `describe` and `suite`.

```ts
// ❌
test.only('saves the user', () => {})

// ✅
test('saves the user', () => {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `additionalTestFunctions` | `string[]` | `[]` | Extra test function names |

```ts
'arch/tests-modifiers': ['error', { additionalTestFunctions: ['bench'] }]
```
