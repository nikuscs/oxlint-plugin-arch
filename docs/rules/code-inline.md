# arch/code-inline

A one-line `const` read once is inlined where it is read, unless a call, assignment or other side effect runs between them. The same applies to a top-level `const` or function declaration read once. A top-level `const` that only wraps one arrow or a shallow call, read more than once, is inlined at each use.

A local is a block-scoped `const`; it is left alone when inlining would cross a function, nest calls past `nesting`, make the line longer than `max`, or need parentheses. Object and array literals (also under `as` or `satisfies`), locals holding a `yield` and exported names are skipped.

```ts
// ❌
const id = load()
save(id)

// ✅
save(load())
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `160` | Longest line the inlined value may produce (at least 1) |
| `nesting` | `number` | `2` | Deepest call nesting the inlined value may produce (at least 1) |
| `callbacks` | `boolean` | `false` | Count nesting through inline callbacks, as [`layout-call-depth`](layout-call-depth.md) does with `callbacks`; pair the two so a value that rule asks you to name is not inlined back |
| `allow` | `string \| string[]` | | Regex for names never reported |
| `keep` | `string \| string[]` | | Regex for top-level names skipped by the wrapper check |
| `services` | `string[]` | `[]` | Methods whose object argument names service members; a value passed there is kept, such as `send` in `Mail.of({ send })` |

`max`, `nesting` and `callbacks` apply everywhere: nothing is inlined where the result would pass `max` columns or `nesting`. `services` applies to locals, `keep` only to the top-level wrapper check, and `allow` to both.

```ts
'arch/code-inline': ['error', { max: 140, keep: '^[A-Z]', services: ['of'] }]
```
