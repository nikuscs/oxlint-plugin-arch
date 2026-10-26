# arch/comments-code

Removes comments. Directives (`oxlint-disable`, `@ts-expect-error`, `#__PURE__`), `Why:` notes and allowed patterns stay. 🔧

```ts
// ❌
// load the user
const user = await load(id)

// ✅
// Why: the cache is warmed by the worker.
const user = await load(id)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `why` | `boolean` | `true` | Keep `// Why:` notes |
| `allow` | `string[]` | `[]` | Regexes for comments to keep |
| `jsdoc` | `boolean` | `false` | Keep `/** */` blocks |
| `members` | `'off' \| 'also' \| 'only'` | `'off'` | Also check, or only check, comments on interface, type and object members |

`why`, `jsdoc` and `allow` also apply to member comments. Fixes preserve separating line breaks and never cross member tokens. Removing an inline comment immediately after `(` also removes adjacent horizontal padding: `foo(/* note */ 1)` becomes `foo(1)`. Comments targeted by a preceding disable-next-line directive are reported without a fix.

```ts
'arch/comments-code': ['error', { why: false, allow: ['^\\s*SAFETY: '] }]
```
