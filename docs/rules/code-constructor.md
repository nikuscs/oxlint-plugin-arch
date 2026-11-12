# arch/code-constructor

A `new` expression, and optionally a plain call, of a name listed in `constructors`. Names match the whole dotted callee: `Error` does not match `globalThis.Error` or `foo.Error`, so list each spelling. An empty `constructors` list turns the rule off.

```ts
// ❌
const now = new Date()

// ✅
const now = clock.now()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `constructors` | `(string \| { name, message? })[]` | required | Dotted names to ban, with an optional hint |
| `calls` | `boolean` | `false` | Also report calls without `new` |
| `message` | `string` | | Hint for entries without their own; an entry's own `message` wins |

```ts
'arch/code-constructor': ['error', { constructors: [{ name: 'Date', message: 'Use clock.now().' }], calls: true }]
```
