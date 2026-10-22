# `modules/service-types`

Preset-internal rule: only the matching factory-derived `Service` alias may stay in a service file. Types such as `ChatDeps` belong in domain types.

## Why

Interfaces always fail. Type aliases fail unless they are exactly `export type ChatService = ReturnType<typeof makeChatService>`: the name ends with `Service`, the value is `ReturnType<typeof make{Name}>`, and the factory name matches.

## Examples

❌ Incorrect

```ts
export interface Deps {
  id: string
}

export function makeDepsService() {
  return { id: 'one' }
}
```

```ts
type ChatService = ReturnType<typeof makeOtherService>
```

✅ Correct

```ts
export function makeDepsService() {
  return { send: depsActionSend }
}
export type DepsService = ReturnType<typeof makeDepsService>
```

## Options

This rule has no options.

## Preset

Preset: `typePlacement` policy, on app `services/**` (utilities, constants, types files and tests excluded).

## Related

- [`modules/service-functions`](./service-functions.md)
- [`../arch/no-type-declarations`](../arch/no-type-declarations.md)
