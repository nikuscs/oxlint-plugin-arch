# arch/effect-config-keys

An env key read through a config call starts with the prefix of the file it is read in, or a shared prefix.

```ts
// { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] }
// ❌ domains/supplier-order/supplier-order.config.ts
export const supplierOrderToken = Config.redacted('TOKEN')

// ✅
export const supplierOrderToken = Config.redacted('SUPPLIER_ORDER_TOKEN')
export const supplierOrderAppUrl = Config.string('APP_URL')
```

The key is the plain string first argument of a `callees` call; a key built at runtime is skipped. `prefix` takes placeholders from the path: `{DOMAIN}` is the captured `{domain}` in SCREAMING_CASE (`supplier-order` gives `SUPPLIER_ORDER`), `{Domain}` PascalCase and `{domain}` as written; `{folder}`, `{parent}`, `{stem}` and `{file}` work too. Without `prefix` or `allow` the rule does nothing.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `prefix` | `string \| string[]` | none | Templates a key may start with |
| `allow` | `string[]` | none | Plain prefixes every file may use, such as `'APP_'` |
| `callees` | `string[]` | Effect's `Config` readers | Dotted callee names whose first argument is a key; `*` is any text. The default lists `Config.string`, `number`, `integer`, `boolean`, `redacted`, `url`, `port`, `duration`, `date`, `bigint`, `logLevel`, `nonEmptyString` and `secret`, in both casings; `Config.nested`, `all`, `succeed` and `fail` are never keys |
| `message` | `string` | none | Text added to every report |
| `file`, `placeholder` | `string` | none | Path template of the file being linted, like `domains/{domain}/**`; a file it does not match is skipped |
| `stem`, `singularize`, `roles`, `separators` | | | How `{stem}` and `{domain}` are read, as in [`arch/files-exports`](files-exports.md) |

```ts
'arch/effect-config-keys': ['error', { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] }]
'arch/effect-config-keys': ['error', { prefix: 'SERVER_' }]
```
