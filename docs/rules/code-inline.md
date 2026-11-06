# arch/code-inline

A one-line `const` read once is inlined where it is read. A top-level `const` that only wraps one arrow or a shallow call is inlined at each use.

A local is left alone when inlining would cross a function, nest calls past `nesting`, make the line longer than `max`, or need parentheses. Data literals, values holding a `yield` and exported names are skipped.

```ts
// ❌
const id = load()
save(id)

// ✅
save(load())
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `160` | Longest line the inlined value may produce |
| `nesting` | `number` | `2` | Deepest call nesting the inlined value may produce |
| `allow` | `string \| string[]` | | Regex for names never reported |
| `keep` | `string \| string[]` | | Regex for top-level names skipped by the wrapper check |
| `services` | `string[]` | `[]` | Methods whose object argument names service members; a value passed there is kept |

```ts
'arch/code-inline': ['error', { max: 140, keep: '^[A-Z]', services: ['of'] }]
```
