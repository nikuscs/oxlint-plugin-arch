# arch/code-trivial-functions

A top-level function whose body only returns a name, literal, member access or single call, plus banned helper names and generic type-guard helpers. An `export default` function expression is checked as `default`.

```ts
// ❌
export function getUser(id: string) {
  return repo.find(id)
}

// ✅
export function total(price: number, quantity: number) {
  return price * quantity
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `mode` | `'legacy' \| 'precise'` | `'legacy'` | `'precise'` flags only pure forwarders and turns on guard checks |
| `allow` | `string \| string[]` | | Regex for function names to skip |
| `callees` | `string[]` | `[]` | Regexes for forwarded callees to allow |
| `async` | `boolean` | `false` | Allow async functions that forward a call |
| `services` | `boolean` | `false` | Also check methods of exported `const` objects |
| `deny` | `string[]` | `[]`, or `isRecord`, `isString`, ... in `precise` | Helper names always reported |
| `guards` | `boolean` | `true` in `precise`, else `false` | Report `typeof` and `Array.isArray` guard helpers |

```ts
'arch/code-trivial-functions': ['error', { mode: 'precise', callees: ['^z\\.'] }]
```
