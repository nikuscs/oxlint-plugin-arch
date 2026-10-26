# arch/code-object-params

An exported function with more than `max` parameters, or a parameter not typed as an object. A default value does not hide the parameter type, and an `export default` function expression is checked as `default`.

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
| `max` | `number` | `1` | Most object parameters allowed |
| `all` | `boolean` | `false` | Also check unexported top-level functions |
| `services` | `boolean` | `false` | Also check methods of exported `const` objects |
| `allow` | `string \| string[]` | | Regex for function names to skip |

```ts
'arch/code-object-params': ['error', { all: true, services: true }]
```
