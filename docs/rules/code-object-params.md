# arch/code-object-params

An exported function with more than `maxParams` parameters, or a parameter not typed as an object.

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
| `maxParams` | `number` | `1` | Most object parameters allowed |
| `allDeclarations` | `boolean` | `false` | Also check unexported top-level functions |
| `serviceMethods` | `boolean` | `false` | Also check methods of exported `const` objects |
| `allowPattern` | `string \| string[]` | | Regex for function names to skip |

```ts
'arch/code-object-params': ['error', { allDeclarations: true, serviceMethods: true }]
```
