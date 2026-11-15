# 🧬 What a file may contain

Every check here is scoped by a folder or file key, so one kind of file (`*.test.ts`, `*.schemas.ts`, `domains/*/*.actions.ts`) gets one shape. Pick the row for what you want to lock down.

| I want | Use | Example |
| --- | --- | --- |
| Only some statements at the top level (tests hold only `it`) | [`top`](groups/top.md) | `top: ['describe', 'it', 'it.each']` |
| No types, interfaces, enums, classes, `let` or functions in a file | [`top`](groups/top.md) with `deny` | `top: { deny: ['type', 'interface', 'let', 'function', 'function-const'] }` |
| Every constant built by one thing (schemas only) | [`top`](groups/top.md) with `from` | `top: { allow: ['type', { kind: 'const', from: '^Schema\\.' }] }` |
| Only these exports | [`arch/files-exports`](rules/files-exports.md) | `names: ['make{Domain}Service', '{Domain}Service']` |
| Every export starts with the file or folder name | [`arch/naming-exports`](rules/naming-exports.md) | `{ prefix: ['file', 'folder'] }` |
| Every function follows a name pattern | [`arch/naming-exports`](rules/naming-exports.md), [`arch/naming-declarations`](rules/naming-declarations.md) | `{ mode: 'pattern', scope: 'functions', pattern: '^{folder}Action[A-Z]' }` |
| One function named after the file | [`arch/naming-exports`](rules/naming-exports.md) `template` | `{ mode: 'template', file: '{domain}-action.{name}.ts', export: '{domain}Action{Name}' }` |
| A label follows the name it is given to (a span, a workflow name, a service key, an error tag) | [`arch/naming-labels`](rules/naming-labels.md) | `{ callee: 'Effect.fn', name: '{name}', loose: true }` |
| A value bound under a key is named after the key path | [`arch/naming-keys`](rules/naming-keys.md) | `{ callees: ['Domain.bind'], name: '^{folder}Action{Path}$' }` |
| A layer binds exactly the methods its service declares | [`arch/effect-layer-keys`](rules/effect-layer-keys.md) | `{ service: '/repo/contract/src/{folder}/{folder}.service.ts' }` |
| Dependencies are yielded first | [`arch/effect-yields-first`](rules/effect-yields-first.md) | `'error'` |
| A call is banned inside another call's callback | [`arch/code-inside`](rules/code-inside.md) | `{ callee: '*.transaction', calls: { '*.send': '…' } }` |
| A file name fits its folder | [`arch/naming-file`](rules/naming-file.md) `template` | `template: '{group}/rpc.{group}.{area}.ts'` |
| A yielded service has one local name | [`arch/effect-yield-name`](rules/effect-yield-name.md) | `{ names: { 'Database.Database': 'db' } }` |
| An import is always named the same way | [`naming.imports`](groups/naming.md) | `imports: { '@scope/kit-{package}': '{Package}Kit' }` |
| An import or call is banned here | [`deny`](groups/deny.md) | `deny: { calls: { insertInto: 'A query reads only.' } }` |
| An import or call is used in one place only | [`deny.only`](groups/deny.md#only-here) | `only: [{ imports: '@scope/kit-auth', in: 'src/domains/auth' }]` |
| File names in a folder | [`layout.files`](groups/layout.md), [`naming.files`](groups/naming.md) | `layout: { files: ['*.prompts.ts'] }` |
| No functions, constants only, types only, components only | [`arch/files-no-functions`](rules/files-no-functions.md), [`arch/files-constants-only`](rules/files-constants-only.md), [`arch/files-types-only`](rules/files-types-only.md), [`arch/files-components-only`](rules/files-components-only.md) | `rules: { 'arch/files-types-only': 'error' }` |
| No such file at all | [`arch/files-restricted`](rules/files-restricted.md) | `rules: { 'arch/files-restricted': ['error', { message: 'Tests live in tests/.' }] }` |

## A test file that holds only tests

```ts
folders: {
  'apps/server/tests/**/*.test.ts': { top: { allow: ['describe', 'it', 'it.each'], message: 'Build fixtures inside the test or in tests/kits.' } },
}
```

```ts
// ❌
const rows = [1, 2]
function build() {}

// ✅
it.each([1, 2])('row %s', () => {})
```

## A domain folder with named operations

```ts
folders: {
  'apps/server/src/domains/*/*.actions.ts': {
    top: { allow: ['type', { kind: 'const', exported: true }] },
    rules: {
      'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Action[A-Z]\\w*'], types: true }],
      'arch/naming-declarations': ['error', { kinds: ['type', 'interface'], pattern: '^{Folder}Action' }],
    },
  },
}
```

## Names from the path

`{folder}`, `{parent}`, `{stem}`, `{file}` and `{domain}` are read from the file path in [`arch/files-exports`](rules/files-exports.md#placeholders), [`arch/naming-exports`](rules/naming-exports.md), [`arch/naming-declarations`](rules/naming-declarations.md) and [`arch/files-top-level`](rules/files-top-level.md). `file` adds your own, across folders: `file: '{area}/actions/{verb}.ts'` gives `{area}` and `{verb}`. A capitalized placeholder is PascalCase, a lowercase one camelCase, an uppercase one constant case.

## One list, used many times

Declare a list once in [`sets`](folders.md#-sets) and name it wherever a key or a list goes, so the config needs no constants or helper functions.

```ts
export default preset({
  root: import.meta.dirname,
  sets: {
    kits: { 'kit-auth': 'auth', 'kit-payments': 'payment' },
    writes: ['insertInto', 'updateTable', 'deleteFrom'],
  },
  folders: {
    'apps/server/src': {
      deny: { only: [{ each: 'kits', imports: ['@scope/{key}', '@scope/{key}/*'], in: 'apps/server/src/domains/{value}', message: 'Call the {value} domain.' }] },
    },
    'apps/server/src/domains/*/*.queries.ts': { deny: { calls: { '{writes}': 'A query reads only.' } } },
  },
})
```
