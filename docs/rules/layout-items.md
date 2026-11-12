# arch/layout-items

A multi-line object or array puts each item on its own line. Needs at least two items. Destructuring patterns and type literals are not checked.

The fix changes only whitespace and keeps commas as written. Arrays with holes and items separated by comments are reported without a fix.

```ts
// ❌
const user = {
  id, name,
}

// ✅
const user = {
  id,
  name,
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `indent` | `number \| 'tab'` | `2` | Indent per level for the fix |

```ts
'arch/layout-items': 'error'
```
