# arch/layout-chain

Every `.method()` on its own line when a call chain matches one of `groups`.

Chains with computed links such as `[method]()` are skipped, and `groups: []` turns the rule off. A chain with a comment between links is reported without a fix.

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
| `groups[].min` | `number` | required | Fewest calls; alone it matches any chain |
| `groups[].methods` | `string[]` | | Match when any call uses one of these |
| `groups[].only` | `string[]` | | Match when every call uses one of these |
| `groups[].root` | `string \| string[]` | | Regex for the chain's root identifier (a root that is not an identifier never matches) |
| `indent` | `number \| 'tab'` | `2` | Indent for the fix |

Within a group, a chain matches when `min` is met and any one of `methods`, `only` or `root` matches.

```ts
'arch/layout-chain': ['error', { groups: [{ min: 3 }, { min: 2, root: '^(db|tx)$' }] }]
```
