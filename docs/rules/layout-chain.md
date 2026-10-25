# arch/layout-chain

Every `.method()` on its own line when a call chain matches one of `groups`.

```ts
// ❌
const rows = await db.select().from(users).where(active)

// ✅
const rows = await db
  .select()
  .from(users)
  .where(active)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `groups` | `object[]` | required | A chain matching any group must break |
| `groups[].minDepth` | `number` | required | Fewest calls; alone it matches any chain |
| `groups[].methods` | `string[]` | | Match when any call uses one of these |
| `groups[].onlyMethods` | `string[]` | | Match when every call uses one of these |
| `groups[].rootPattern` | `string \| string[]` | | Regex for the chain's root identifier |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

```ts
'arch/layout-chain': ['error', { groups: [{ minDepth: 3 }, { minDepth: 2, rootPattern: '^(db|tx)$' }] }]
```
