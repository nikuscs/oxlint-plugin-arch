# arch/layout-padding

A missing blank line between variables and control flow, around functions and classes, between control-flow statements, and before `return`.

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
| `min` | `number` | `3` | Block size before `return` needs a blank line |
| `multiline` | `boolean` | `false` | Also pad multiline variable declarations |

```ts
'arch/layout-padding': ['error', { min: 3, multiline: true }]
```
