# arch/code-paired-call

A call to `when` in a file that never calls `require`. A bare name matches the function or method name (`useFakeTimers` matches `vi.useFakeTimers()`); a dotted name matches the receiver and method (`rpcErrors.message` matches `rpcErrors.message()` and not `other.message()`). A called function or dotted receiver that resolves to an aliased import matches the imported name. Only the first call to `when` reports, once per pair.

```ts
// with { when: 'useFakeTimers', require: 'useRealTimers' }
// ❌
vi.useFakeTimers()
run()

// ✅
vi.useFakeTimers()
run()
vi.useRealTimers()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `when` | `string` | | Call that needs a partner; set together with `require` |
| `require` | `string \| string[]` | | Partner call that must appear in the same file; with a list, any one of them; set together with `when` |
| `pairs` | `{ when, require }[]` | | More pairs, with or instead of `when` |

```ts
'arch/code-paired-call': ['error', { pairs: [{ when: 'useFakeTimers', require: 'useRealTimers' }] }]
'arch/code-paired-call': ['error', { pairs: [{ when: 'useMutation', require: ['formServerErrors', 'rpcErrors'] }] }]
```
