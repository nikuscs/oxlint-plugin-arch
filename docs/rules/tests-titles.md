# arch/tests-titles

Reports static test titles that match `deny` or miss `require`; it does nothing without either.

```ts
// ❌
test('should save the user', () => {})

// ✅
test('saves the user', () => {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `callees` | `string[]` | `['describe', 'it', 'test']` | Calls whose titles are checked |
| `modifiers` | `string[]` | `['only', 'skip', 'concurrent', 'sequential', 'todo', 'each', 'for']` | Modifiers after a callee, like `test.skip`, that are checked too; add `'fails'` to check `test.fails` |
| `deny` | `string \| string[]` | none | Regexes a title must not match |
| `require` | `string \| string[]` | none | Regexes a title must match (any one) |
| `flags` | `string` | `''` | Regex flags for both lists |

```ts
'arch/tests-titles': ['error', { deny: '^should' }]
```
