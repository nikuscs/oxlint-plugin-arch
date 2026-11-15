# arch/files-siblings

A file needs other files beside it, or may not sit beside some.

```ts
// require: '{folder}.service.ts'
// ❌ order/order.contract.ts, alone in order/

// ✅ order/order.contract.ts next to order/order.service.ts
```

`{folder}`, `{parent}`, `{stem}`, `{file}` and `{domain}` come from the file's own path, as written, and `file` adds its own captures. Each listed file must exist in the same folder; a path with `/` or `../` reaches another folder.

```ts
// file: 'kit-{module}/test/{name}.{kind}.test.ts', require: '../src/{name}.{kind}.ts'
// ❌ kit-wallet/test/wallet.fake.test.ts, with no kit-wallet/src/wallet.fake.ts

// require: [['{folder}.service.ts', '{folder}.queries.ts']]
// ✅ order/order.contract.ts next to order/order.queries.ts

// forbid: '{stem}-users.types.ts'
// ❌ order/order.types.ts next to order/order-users.types.ts
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `require` | `string \| (string \| string[])[]` | none | File names that must exist beside this one; an entry that is a list passes when any one of its names exists |
| `forbid` | `string \| string[]` | none | File names that may not exist beside this one |
| `when` | `string \| string[]` | none | Globs of file names in the same folder; the check runs only when one exists. `!` before a glob: only when none matches (`'!{folder}.legacy.ts'`). Path placeholders apply |
| `message` | `string` | none | Text added to every report |
| `file`, `placeholder`, `stem`, `singularize`, `roles`, `separators` | | | How the placeholders are read, as in [`arch/files-exports`](files-exports.md); a file `file` does not match is skipped |

At least one of `require` or `forbid` is required.

```ts
{ files: ['src/*/*.contract.ts'], rules: { 'arch/files-siblings': ['error', { require: '{folder}.service.ts' }] } }
{ files: ['kit-*/test/*.test.ts'], rules: { 'arch/files-siblings': ['error', { file: 'kit-{module}/test/{name}.{kind}.test.ts', require: '../src/{name}.{kind}.ts' }] } }
```
