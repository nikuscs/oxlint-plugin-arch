# arch/types-unknown

Reports `unknown` except on a type guard's checked parameter or a `catch` callback's first parameter.

```ts
// ❌
function parse(input: unknown) {}

// ✅
function isUser(value: unknown): value is User {}

load().catch((error: unknown) => report(error))
```

```ts
'arch/types-unknown': 'error'
```
