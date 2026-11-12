# arch/layout-type-arguments

One type per line once a single-line type argument list holds a union of `min` or more types.

The fix puts every argument and every member of the union on its own line, each member after a leading `|`. Lists with comments or parenthesized members are reported without a fix.

```ts
// ❌
const live = Auth.layer<Blacklist | Database | Mail>({})

// ✅
const live = Auth.layer<
  | Blacklist
  | Database
  | Mail
>({})

// ❌ several arguments
f<A, B | C | D>(x)

// ✅ only the union gets leading bars
f<
  A,
  | B
  | C
  | D
>(x)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `3` | Smallest union that must break (at least 2) |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

```ts
'arch/layout-type-arguments': ['error', { min: 3 }]
```
