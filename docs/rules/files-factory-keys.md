# arch/files-factory-keys

Reports keys in objects returned by matching factories that are not allowed, and missing required keys. Off until `keys` or `sets` is set.

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
| `factory` | `string \| string[]` | `'^make[A-Z]'` | Factory names to check |
| `required` | `string[]` | `[]` | Keys every returned object must have |
| `sets` | `{ factory, keys, required? }[]` | none | Separate key lists per factory pattern |

```ts
'arch/files-factory-keys': ['error', { keys: ['id', 'name'], required: ['id'] }]
```
