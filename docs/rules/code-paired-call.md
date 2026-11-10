# arch/code-paired-call

A call to `when` in a file that never calls `require`. Names match the function or method name; a called name that resolves to an aliased import matches the imported name.

```ts
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
| `when` | `string` | | Call that needs a partner |
| `require` | `string` | | Partner call that must appear |
| `pairs` | `{ when, require }[]` | | More pairs, with or instead of `when` |

```ts
'arch/code-paired-call': ['error', { pairs: [{ when: 'useFakeTimers', require: 'useRealTimers' }] }]
```
