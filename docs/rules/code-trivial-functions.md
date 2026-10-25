# arch/code-trivial-functions

A top-level function whose body only returns a name, literal, member access or single call, plus banned helper names and generic type-guard helpers.

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
| `allowPattern` | `string \| string[]` | | Regex for function names to skip |
| `allowCallees` | `string[]` | `[]` | Regexes for forwarded callees to allow |
| `allowAsync` | `boolean` | `false` | Allow async functions that forward a call |
| `checkServiceMethods` | `boolean` | `false` | Also check methods of exported `const` objects |
| `bannedNames` | `string[]` | `[]`, or `isRecord`, `isString`, ... in `precise` | Helper names always reported |
| `checkGenericGuards` | `boolean` | `true` in `precise`, else `false` | Report `typeof` and `Array.isArray` guard helpers |

```ts
'arch/code-trivial-functions': ['error', { mode: 'precise', allowCallees: ['^z\\.'] }]
```
