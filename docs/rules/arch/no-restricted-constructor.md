# `arch/no-restricted-constructor`

Rejects `new` of configured constructors, and can also reject calling them without `new`.

## Why

Typed errors should use a domain constructor. `throw new Error('x')` bypasses that contract.

## Examples

❌ Incorrect

```ts
throw new Error('x')
new Error()
```

With `checkCalls: true`:

```ts
throw Error('x')
```

✅ Correct

```ts
throw new DomainError('x')
const value = new Map()
type Failure = Error
new foo.Error('x')
```

Without `checkCalls`, `throw Error('x')` passes. Computed callees such as `foo["Error"]` are not matched.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `constructors` | `(string \| { name: string; message?: string })[]` | required | Constructor names, including dotted paths such as `globalThis.Error`. A per-name `message` overrides the rule-level message. |
| `checkCalls` | `boolean` | `false` | Also reject calls without `new`. |
| `message` | `string` | none | Extra sentence appended to every report that has no per-constructor message. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-restricted-constructor': [
    'error',
    {
      constructors: ['Error'],
      checkCalls: true,
      message: 'Throw a domain error instead.',
    },
  ],
}
```

## Preset

Preset: `typeSafety` policy, on app and test files, with `{ constructors: ['Error'], checkCalls: true }`.

## Related

- [`arch/no-restricted-token`](./no-restricted-token.md)
