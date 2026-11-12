# arch/comments-code

Removes comments. Tool directives (`oxlint-disable`, `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `biome-ignore`, `prettier-ignore`, `#__PURE__`, triple-slash references, JSX pragmas, `/*! legal */` blocks, source map and bundler hints), `Why:` notes and allowed patterns stay. 🔧

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
| `why` | `boolean \| string` | `true` | Keep `// Why:` notes and their continuation lines; a string replaces the `Why:` prefix, such as `'NOTE:'`; a trailing space is optional. Case sensitive, and the text needs a space after the prefix |
| `allow` | `string[]` | `[]` | Regexes tested against the trimmed comment text, without `//` or `/* */` |
| `jsdoc` | `boolean` | `false` | Keep `/** */` blocks (a `/* */` block is not kept) |
| `members` | `'off' \| 'also' \| 'only'` | `'off'` | Also check, or only check, comments on interface, type and object members |
| `steps` | `boolean` | `false` | Keep a single `//` line directly above a statement inside a function or a property in an object literal. Trailing comments, blocks of two or more lines, block comments and comments followed by a blank line or by nothing are still removed |

`why`, `jsdoc` and `allow` also apply to member comments. Fixes preserve separating line breaks and never cross member tokens. Removing an inline comment immediately after `(` also removes adjacent horizontal padding: `foo(/* note */ 1)` becomes `foo(1)`. Comments targeted by a preceding disable-next-line directive, and a comment in an empty JSX expression (`{/* note */}`), are reported without a fix. A shebang is never reported.

```ts
'arch/comments-code': ['error', { why: false, allow: ['^\\s*SAFETY: '] }]
'arch/comments-code': ['error', { why: false, steps: true }]
```
