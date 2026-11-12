# arch/backend-service-functions

Reports private functions in a service file: a top-level function that is not the one exported operation, and a function nested inside it (unless `helpers`, `methods` or `frontend` allow it).

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
  return db.insert({ title: title.trim() })
}

// ✅ with helpers: true
export function createChat(title: string) {
  const normalize = (value: string) => value.trim()
  return db.insert({ title: normalize(title) })
}
```

With two or more top-level functions every one is reported, the exported ones too, even with `helpers: true`. `frontend` allows several exported operations; a private top-level function is always reported.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `helpers` | `boolean` | `false` | Allow helpers nested inside the operation |
| `methods` | `boolean` | `false` | Allow functions returned as properties of the operation's object |
| `frontend` | `boolean` | `false` | Several exported operations (functions or object methods), each with local helpers; implies `helpers` |
| `single` | `boolean` | `false` | Export exactly one named operation and nothing else: an extra export, a type export, a re-export or a default export reports. Wins over `frontend` |
| `message` | `string` | | Replaces the report text; the default differs for `helpers`, `frontend` and the strict default |

```ts
// ✅ methods: true
export function create() {
  function read() {
    return value
  }
  return { read }
}

// ❌ methods: true, read is not returned
export function create() {
  function read() {
    return value
  }
  return {}
}

// ✅ frontend: true
export function read() {
  function normalize() {
    return 1
  }
  return normalize()
}
export const write = () => 2

// ❌ frontend: true, single: true
export function read() {}
export function write() {}
```

```ts
'arch/backend-service-functions': ['error', { helpers: true, single: true }]
```
