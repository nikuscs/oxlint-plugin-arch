# arch/files-top-level

Reports top-level statements a file may not hold: with `allow`, everything not listed; with `deny`, everything listed. Statements inside a function are never checked.

```ts
// allow: ['import', 'it', 'it.each']
// ❌ tests/order.test.ts
const rows = [1, 2]
function build() {}
it('works', () => {})

// ✅
it.each([1, 2])('row %s', () => {})
```

An entry is a kind, a call name, or an object. A string that is not a kind is a call name: `'it'`, `'it.each'`, or `'describe*'`, where `*` is any text. A call is read by its first callee, so `it.each(rows)('name', fn)` is `it.each`.

| Kind | Matches | `names` reads |
| --- | --- | --- |
| `import` | `import` statements | the specifier |
| `export` | `export { a }` lists | the exported name |
| `reexport` | `export * from` and `export { a } from` | the specifier, or the exported name |
| `default` | `export default <value>` | what builds the value |
| `type`, `interface`, `enum`, `class`, `namespace` | that declaration, exported or not | its name |
| `const`, `let`, `var` | a variable that does not hold a function | its name |
| `function` | a function declaration | its name |
| `function-const` | a variable holding an arrow function or function expression | its name |
| `call` | a call statement, awaited or not | the callee, such as `it.each` |
| `statement` | anything else: `if`, loops, assignments, `using` | the node type |

| Entry key | Type | |
| --- | --- | --- |
| `kind` | kind or kind list | required |
| `names` | `string \| string[]` | Regexes; the item must match one |
| `from` | `string \| string[]` | Regexes on what builds a variable's value: the callee (`Schema.Struct`), the identifier, or `<literal>`, `<object>`, `<array>`, `<function>`, `<other>`. Read through `.pipe(...)`, `await` and type assertions |
| `exported` | `boolean` | Only exported items, or only unexported ones |
| `uses` | `number` | Only a declared name read at least this many times in the file, such as a decoder shared by two functions (`uses: 2`) |
| `message` | `string` | `deny` only: report text for this entry |

```ts
// allow: ['import', 'type', { kind: 'const', from: '^Schema\\.', exported: true }]
// ❌ order.schemas.ts
export const MAX_ROWS = 50

// ✅
export const Order = Schema.Struct({ id: Schema.String })
```

`names` and `from` take the placeholders of [`arch/files-exports`](files-exports.md#placeholders): `{Domain}`, `{folder}`, `{Stem}` and the captures of `file`. `deny` wins over `allow`.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allow` | entry list | none | Only these may sit at the top level |
| `deny` | entry list | none | These may not |
| `message` | `string` | none | Text added to every report |
| several objects | | | Pass more than one options object to run each as its own check |
| `when` | `string \| string[]` | none | Globs of file names; the check runs only when one sits beside the file. `!` before a glob: only when none matches. Path placeholders apply: `'{stem}-*.types.ts'` |
| `stem`, `singularize`, `roles`, `separators`, `file`, `placeholder` | | | How the placeholders are read, as in [`arch/files-exports`](files-exports.md) |

At least one of `allow` or `deny` is required.

```ts
'arch/files-top-level': ['error', { allow: ['import', 'describe', 'it', 'it.each'], message: 'Build fixtures inside the test.' }]
'arch/files-top-level': ['error', { deny: ['let', 'var', { kind: ['function', 'function-const'], message: 'A constants file holds no functions.' }] }]
'arch/files-top-level': ['error', { stem: 'folder', allow: ['import', 'type', { kind: 'const', names: '^{Domain}', from: '^Schema\\.' }] }]
```
