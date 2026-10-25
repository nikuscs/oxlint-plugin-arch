# arch/comments

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
| `allowWhy` | `boolean` | `true` | Keep `// Why:` notes |
| `allowPatterns` | `string[]` | `[]` | Regexes for comments to keep |
| `allowJsdoc` | `boolean` | `false` | Keep `/** */` blocks |
| `members` | `'off' \| 'also' \| 'only'` | `'off'` | Also check, or only check, comments on interface and type members |

```ts
'arch/comments': ['error', { allowWhy: false, allowPatterns: ['^\\s*SAFETY: '] }]
```
