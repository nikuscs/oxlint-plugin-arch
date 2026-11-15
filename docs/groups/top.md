# 🧱 top

What may sit at the top level of a file. On by default, empty: it adds no rule until a folder or file key lists something.

```ts
folders: {
  'apps/server/tests/**/*.test.ts': { top: ['describe', 'it', 'it.each'] },
  'packages/contract/src/*/*.schemas.ts': { top: { allow: ['type', { kind: 'const', from: '^Schema\\.' }] } },
  'apps/server/src/**/*.constants.ts': { top: { deny: ['let', 'function', 'function-const'] } },
}
```

Takes `true`, `false`, `'warn'`, a list (the same as `{ allow }`) or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `allow` | entry list | none | Only these may sit at the top level; `import` is always added |
| `deny` | entry list | none | These may not; `deny: ['import']` bans imports too |
| `message` | `string` | none | Text added to every report |
| `stem`, `singularize`, `roles`, `separators`, `file`, `placeholder` | | none | How `{Domain}` and the other placeholders in `names` and `from` are read, as in [`arch/files-exports`](../rules/files-exports.md#placeholders) |

An entry is a kind (`type`, `interface`, `enum`, `class`, `const`, `let`, `function`, `function-const` and the rest), a call name (`it`, `it.each`, `describe*`) or an object with `kind`, `names`, `from`, `exported`; [`arch/files-top-level`](../rules/files-top-level.md) lists them all. A child folder's list replaces its parent's; `false` turns it off.

Rules: [`arch/files-top-level`](../rules/files-top-level.md).
