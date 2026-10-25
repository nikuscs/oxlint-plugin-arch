# `modules/no-unknown`

Preset-internal rule: do not write the `unknown` type. Use an owned domain type.

## Why

Message: `Use an owned domain type rather than unknown.` App code that needs an `unknown` boundary must use an explicit rule-specific exception.

Two boundaries are allowed because no owned type can exist there:

- The narrowed parameter of a type guard: the parameter named in a `value is T` or `asserts value is T` return type.
- The error parameter (first parameter) of a catch callback: a `catch` property or method, or a function passed to `.catch(...)`.

## Examples

❌ Incorrect

```ts
export type UnknownValue = unknown
export function read(value: unknown) { return String(value) }
promise.then((value: unknown) => value)
```

✅ Correct

```ts
export interface UnknownInput {
  id: string
}
export function isUser(value: unknown): value is User { return isKnownUser(value) }
interface AttemptArgs<E> { catch: (error: unknown) => E }
promise.catch((error: unknown) => report(error))
```

## Options

This rule has no options.

## Preset

Preset: `typeSafety` policy, on app and test files.

## Related

- [`modules/shape-suffix`](./shape-suffix.md)
- [`modules/service-types`](./service-types.md)
