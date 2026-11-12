# arch/types-unknown

Reports `unknown` except on a type guard's checked parameter or a `catch` callback's first parameter. Allowed: the checked parameter of `x is T` and `asserts x is T`; the first parameter of a `.catch(...)` callback, a `catch` property or a `catch` method signature. Return types, aliases, variables and other parameters are reported.

```ts
// ❌
function parse(input: unknown) {}

// ✅
function isUser(value: unknown): value is User {}

load().catch((error: unknown) => report(error))
```

No options.

```ts
'arch/types-unknown': 'error'
```
