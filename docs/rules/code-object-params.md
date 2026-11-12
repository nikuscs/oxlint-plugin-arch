# arch/code-object-params

An exported function, including `export const f = () => {}`, with more than `max` parameters, or a parameter that is not an object: a destructured pattern, an untyped parameter, a type reference, a type literal or an intersection counts as an object; primitives, unions, arrays and function types do not. A default value does not hide the parameter type, and an `export default` function expression is checked as `default`.

```ts
// ❌
export function createUser(name: string, email: string) {
  return db.insert({ name, email })
}

// ✅
export function createUser({ name, email }: CreateUserInput) {
  return db.insert({ name, email })
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `max` | `number` | `1` | Most object parameters allowed (at least 1) |
| `all` | `boolean` | `false` | Also check unexported top-level functions |
| `services` | `boolean` | `false` | Also check methods of exported `const` objects |
| `allow` | `string \| string[]` | | Regex for function names to skip |

```ts
'arch/code-object-params': ['error', { all: true, services: true }]
```
