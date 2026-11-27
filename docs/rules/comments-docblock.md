# arch/comments-docblock

Reports an exported declaration without a `/** … */` docblock right above it.

```ts
// ❌
// Builds a paid order.
export const orderPaidFactory = TestsKit.factory(OrderSchemas.OrderEntry)

// ✅
/** Builds a paid order. */
export const orderPaidFactory = TestsKit.factory(OrderSchemas.OrderEntry)
```

Every top-level `export` of a declaration is checked, `export default function` and `export default class` too; re-exports (`export { x }`, `export * from`) and default expressions are skipped. Only whitespace may sit between the docblock and the `export`: a `//` comment or a plain `/* */` block does not count. One report per statement.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `kinds` | `string[]` | every kind | Declarations checked: `function`, `const`, `let`, `var`, `class`, `type`, `interface`, `enum` |
| `names` | `string \| string[]` | none | Regexes on exported names; when set, only a statement exporting a match is checked |
| `message` | `string` | none | Text added to every report |

```ts
'arch/comments-docblock': 'error'
'arch/comments-docblock': ['error', { kinds: ['const', 'function'], names: '(?:Factory|Scenario|Cases|Layer)$' }]
```
