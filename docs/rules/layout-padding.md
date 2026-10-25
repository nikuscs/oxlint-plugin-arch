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
| `returnMinStatements` | `number` | `3` | Block size before `return` needs a blank line |
| `multilineVariables` | `boolean` | `false` | Also pad multiline variable declarations |

```ts
'arch/layout-padding': ['error', { returnMinStatements: 3, multilineVariables: true }]
```
