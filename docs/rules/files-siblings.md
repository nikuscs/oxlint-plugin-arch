# arch/files-siblings

A file needs other files beside it.

```ts
// require: '{folder}.service.ts'
// ❌ order/order.contract.ts, alone in order/

// ✅ order/order.contract.ts next to order/order.service.ts
```

`{folder}`, `{parent}`, `{stem}` and `{file}` come from the file's own path, as written. Each listed file must exist in the same folder; a path with `/` or `../` reaches another folder.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `require` | `string \| string[]` | required | File names that must exist beside this one |
| `message` | `string` | none | Text added to the report |

```ts
{ files: ['src/*/*.contract.ts'], rules: { 'arch/files-siblings': ['error', { require: '{folder}.service.ts' }] } }
```
