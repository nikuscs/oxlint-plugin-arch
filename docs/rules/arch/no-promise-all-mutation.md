# `arch/no-promise-all-mutation`

Rejects mutation of outer bindings from inside configured promise combinators.

## Why

`results.push(...)` or `total += x` inside `Promise.all` races concurrent updates. Return values and assemble them after the combinator.

## Examples

❌ Incorrect

```ts
const results = []
await Promise.all(items.map(async item => results.push(await load(item))))

let total = 0
await Promise.all(items.map(async item => {
  total += await load(item)
}))
```

✅ Correct

```ts
await Promise.all(
  items.map(async item => {
    const results = []
    results.push(await load(item))
    return results
  }),
)

const results = []
results.push(1)
await Promise.all(items.map(async item => load(item)))
results.push(2)
```

Local bindings created inside the callback may mutate. Methods that are not listed (`concat`) pass. Outer aliases of a mutated binding still fail.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `combinators` | `string[]` | `['Promise.all', 'Promise.allSettled', 'Promise.any', 'Promise.race']` | Call names whose arguments are scanned. |
| `methods` | `string[]` | `['push', 'unshift', 'splice', 'set', 'add']` | Mutating methods on an outer binding. |
| `checkAssignments` | `boolean` | `true` | Also reject assignments, updates, and destructuring into outer bindings. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-promise-all-mutation': [
    'error',
    {
      combinators: ['Promise.all', 'Promise.allSettled', 'Promise.any', 'Promise.race'],
      methods: ['push', 'unshift', 'splice', 'set', 'add'],
      checkAssignments: true,
    },
  ],
}
```

## Preset

Preset: `typeSafety` policy, on app and test files.

## Related

- [`arch/no-literal-in`](./no-literal-in.md)
