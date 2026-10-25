# arch/backend-service-functions

Reports top-level and nested helper functions beside a file's exported operation.

```ts
// ❌
function normalize(title: string) {
  return title.trim()
}

export function createChat(title: string) {
  return db.insert({ title: normalize(title) })
}

// ✅
export function createChat(title: string) {
  const normalize = (value: string) => value.trim()
  return db.insert({ title: normalize(title) })
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allowLocalHelpers` | `boolean` | `false` | Allow helpers nested inside the operation |
| `allowReturnedMethods` | `boolean` | `false` | Allow functions returned as methods of the operation's object |
| `frontend` | `boolean` | `false` | Several exported operations, each with local helpers |
| `singleExport` | `boolean` | `false` | Export exactly one named operation and nothing else |
| `message` | `string` | built in | Report text |

```ts
'arch/backend-service-functions': ['error', { allowLocalHelpers: true, singleExport: true }]
```
