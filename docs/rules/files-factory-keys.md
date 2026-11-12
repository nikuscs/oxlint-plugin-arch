# arch/files-factory-keys

Reports keys in objects returned by matching factories that are not allowed, and missing required keys. Off until `keys` or `sets` is set. Only top-level factories and object literals they return directly are checked. TypeScript assertions (including `as const`), `satisfies` and non-null wrappers do not hide returned object keys.

```ts
// ❌
export function makeUser() {
  return { id: 1, debug: true }
}

// ✅
export function makeUser() {
  return { id: 1, name: 'Ada' }
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `keys` | `string[]` | none | Allowed keys |
| `factory` | `string \| string[]` | `'^make[A-Z]'` | Regexes on factory function names |
| `required` | `string[]` | `[]` | Keys every returned object must have; they are allowed even when not in `keys` |
| `sets` | `{ factory, keys, required? }[]` | none | Per-factory key lists, `factory` is a regex. The first matching set wins and replaces `keys`/`required` for that factory; `keys` applies to factories no set matches |

A spread or computed key counts as an extra key. An empty object is reported when `required` is not empty.

```ts
'arch/files-factory-keys': ['error', { keys: ['id', 'name'], required: ['id'] }]
```
