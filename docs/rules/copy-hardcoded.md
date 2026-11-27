# arch/copy-hardcoded

Reports user-facing text typed into JSX: text children, string children and the string values of text attributes.

```tsx
// ❌
const Orders = () => <h1>Manage your orders</h1>
const Search = () => <input placeholder="Search orders" />

// ✅
const Orders = () => <h1>{m.orders_title()}</h1>
const Search = () => <input placeholder={m.orders_search()} />
```

Text with no letter never reports, so punctuation, numbers and entities like `&copy;` pass. Code and units pass too: text made only of identifiers and code punctuation with one code mark (`create_order(`, `productId, quantity, link`, a `{`, `=`), and text whose only words are a number with a short unit (`/1k –`, `24h`, `2x`). A string child (`{'Welcome'}`) and a template without expressions count as text; any other expression is skipped. Only the listed attributes are read, so `className`, `type` and component props outside the list pass.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `attributes` | `string[]` | `['placeholder', 'title', 'aria-label', 'alt', 'label']` | Attributes whose string value is user-facing; replaces the default list |
| `ignore` | `string \| string[]` | URLs, paths, `mailto:`, `tel:` and `#` anchors | Regexes on the trimmed text that pass; replaces the default |
| `exclude` | `string \| string[]` | none | File globs that are skipped, such as `'legal/*.tsx'` |
| `message` | `string` | none | Text added to every report |

```ts
'arch/copy-hardcoded': 'error'
'arch/copy-hardcoded': ['error', { attributes: ['placeholder', 'title', 'aria-label', 'alt', 'label', 'description'], exclude: ['**/*.stories.tsx'], message: 'Use m.<key>().' }]
```
