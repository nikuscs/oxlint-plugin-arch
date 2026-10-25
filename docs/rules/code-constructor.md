# arch/code-constructor

A `new` expression, and optionally a plain call, of a name listed in `constructors`.

```ts
// ❌
const now = new Date()

// ✅
const now = clock.now()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `constructors` | `(string \| { name, message? })[]` | required | Dotted names to ban, with an optional hint |
| `checkCalls` | `boolean` | `false` | Also report calls without `new` |
| `message` | `string` | | Hint for entries without their own |

```ts
'arch/code-constructor': ['error', { constructors: [{ name: 'Date', message: 'Use clock.now().' }], checkCalls: true }]
```
