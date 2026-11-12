# arch/code-paired-call

A call to `when` in a file that never calls `require`. Names match the function or method name, so write bare names (`useFakeTimers`), not dotted ones (`vi.useFakeTimers`); a called name that resolves to an aliased import matches the imported name. Only the first call to `when` reports, once per pair.

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
| `require` | `string` | | Partner call that must appear in the same file; set together with `when` |
| `pairs` | `{ when, require }[]` | | More pairs, with or instead of `when` |

```ts
'arch/code-paired-call': ['error', { pairs: [{ when: 'useFakeTimers', require: 'useRealTimers' }] }]
```
