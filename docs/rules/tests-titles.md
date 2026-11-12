# arch/tests-titles

Reports static test titles that match `deny` or miss `require`; it does nothing without either. Titles built from variables or templates with expressions are skipped; `each`/`for` calls and tagged templates are followed. When both `deny` and `require` fail, both report.

```ts
// ❌ with { deny: '^should' }
test('should save the user', () => {})

// ✅
test('saves the user', () => {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `callees` | `string[]` | `['describe', 'it', 'test']` | Calls whose titles are checked; replaces the default list |
| `modifiers` | `string[]` | `['only', 'skip', 'concurrent', 'sequential', 'todo', 'each', 'for']` | Modifiers after a callee, like `test.skip`, that are checked too; replaces the default list, so add `'fails'` alongside them to check `test.fails` |
| `deny` | `string \| string[]` | none | Regexes a title must not match |
| `require` | `string \| string[]` | none | Regexes a title must match (any one) |
| `flags` | `string` | `''` | Regex flags for both lists |

```ts
'arch/tests-titles': ['error', { deny: '^should' }]
'arch/tests-titles': ['error', { require: '^(saves|loads) ' }]
```
