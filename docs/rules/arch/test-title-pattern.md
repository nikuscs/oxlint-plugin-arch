# `arch/test-title-pattern`

Requires static test titles to satisfy configured required and forbidden regular expressions.

## Why

Consistent test titles are easier to scan. The rule supports common test modifiers and ignores dynamic or interpolated titles that cannot be checked as fixed text.

## Examples

❌ Incorrect

```ts
test('should save', fn)
```

✅ Correct

```ts
test('saves a record', fn)
it.skip('loads a record', fn)
describe.only('records', fn)
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `callees` | `string[]` | `['describe', 'it', 'test']` | Lists test call names to inspect. Supported modifiers include `only`, `skip`, `concurrent`, `sequential`, `todo`, `each`, and `for`. |
| `forbid` | `string \| string[]` | none | Reports a title that matches any listed regular expression. |
| `require` | `string \| string[]` | none | Reports a title that matches none of the listed regular expressions. |
| `flags` | `string` | `''` | Applies JavaScript regular expression flags to all patterns. |

```ts
// oxlint.config.ts
rules: {
  'arch/test-title-pattern': ['error', {
    callees: ['describe', 'it', 'test'],
    forbid: '^should\\b',
    flags: 'i',
  }],
}
```

## Preset

Preset: `tests` policy, on test files. It rejects titles that start with `should`, without regard to case.

## Related

- [`arch/no-comments`](./no-comments.md)
