# arch/layout-arrow-body

An expression body starts on the same line as `=>` when its head fits in `max` columns. The head is the body up to its first `(` for a one-line call, or its chain root for a one-line chain.

```ts
// ❌
const run = () =>
  load(id)

// ✅
const run = () => load(id)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `160` | Line width the joined head must fit |

```ts
'arch/layout-arrow-body': ['error', { max: 140 }]
```
