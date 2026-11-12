# arch/layout-padding

A missing blank line between variables and control flow, around functions and classes, between control-flow statements, and before `return`. A `return` right after a variable declaration is always fine. Only the program and block bodies are checked, not `switch` cases.

The fix inserts the blank line. A comment across the line break, or a `*-disable-next-line` comment ending the previous line, is reported without a fix.

```ts
// ❌
const user = await load(id)
if (!user) {
  throw new NotFound()
}

// ✅
const user = await load(id)

if (!user) {
  throw new NotFound()
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `3` | A `return` after a statement other than a variable declaration needs a blank line when its block has at least `min` statements |
| `multiline` | `boolean` | `false` | Also put a blank line before and after a multiline variable declaration |

```ts
'arch/layout-padding': ['error', { min: 3, multiline: true }]
```
