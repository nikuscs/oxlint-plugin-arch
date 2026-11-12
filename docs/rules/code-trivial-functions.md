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
| `callees` | `string[]` | `[]` | Regexes for forwarded callees to allow, tested unanchored against the dotted callee, such as `^http\.client\.get$` |
| `async` | `boolean` | `false` | Allow async functions that forward a call |
| `services` | `boolean` | `false` | Also check methods of exported `const` objects |
| `deny` | `string[]` | `[]`, or `isRecord`, `isPlainObject`, `isObject`, `isString`, `isNumber`, `isBoolean`, `isArray`, `asRecord`, `asArray` in `precise` | Helper names always reported |
| `guards` | `boolean` | `true` in `precise`, else `false` | Report `typeof` and `Array.isArray` guard helpers |
| `defaults` | `boolean` | `true` | Check the file's default export (a declaration, an anonymous function, or a name exported as default) |

A pure forwarder returns a name, a literal, a template without expressions, or a call whose arguments are exactly its parameters in order (a method's receiver excluded), with no optional call and no default or destructured parameters. A function with a type-predicate return type (`value is User`) is not trivial, but `deny` and `guards` still apply. `deny` replaces the default list in both modes. `deny` and `guards` check every function, not only top-level ones. Setting `guards` works in either mode.

```ts
// ❌ precise: a banned name, and a generic guard under any name
function isString(value: unknown) { return typeof value === 'string' }
function accepts(value: unknown) { return Array.isArray(value) }

// ✅ precise: the argument is transformed (legacy still reports it)
function slug(name: string) { return name.trim().toLowerCase() }
```

```ts
'arch/code-trivial-functions': ['error', { mode: 'precise', callees: ['^z\\.'] }]
'arch/code-trivial-functions': ['error', { mode: 'precise', defaults: false }]
```
