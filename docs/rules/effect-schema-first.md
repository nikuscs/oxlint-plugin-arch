# arch/effect-schema-first

A types file declares Schemas first, then the interfaces that stay, `declare module`, then type aliases, with each Schema's type derived as `typeof X.Type` in Schema order.

It reports a declaration out of that order, an exported Schema (a call or member value) without `export type X = typeof X.Type`, a derived alias out of Schema order or after another alias, and an interface every field of which a Schema could describe. An interface stays when it is empty, generic, matches `keep`, holds a function or method type, or refers to a `runtime` type (any segment of a dotted name), a kept alias or interface, or a type imported from a relative file. The group does not enable it: scope it to your types files in your Oxlint config.

```ts
// ❌
export interface User {
  id: string
}

// ✅
export const User = Schema.Struct({ id: Schema.String })

export type User = typeof User.Type
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `member` | `string` | `'Type'` | Member a derived alias reads: `typeof X.<member>` |
| `keep` | `string \| string[]` | none | Regexes on interface names that stay interfaces |
| `runtime` | `string[]` | `['Effect', 'Layer', 'Stream', 'Context', 'Scope', 'Kysely', 'React', 'Fiber', 'Queue', 'PubSub', 'Ref', 'Deferred', 'ManagedRuntime', 'Sink', 'Channel', 'Request', 'Response', 'Headers', 'ReadableStream', 'WritableStream', 'Blob', 'File', 'AbortSignal', 'WebSocket', 'Socket', 'Worker', 'Uint8Array', 'ArrayBuffer', 'globalThis']` | Type names a Schema cannot describe; an interface that uses one stays; setting it replaces this list |
| `rows` | `{ types?, suffix? }` | off; `{}` turns it on | Reports an alias whose type reads a row type, or an interface that `extends` one; an alias ending with `suffix` may read it. `types` lists dotted type names (default `['Kysely.Selectable']`); `suffix` defaults to `'Record'` |
| `order` | `(section \| section[])[]` | `['values', ['interfaces', 'modules'], 'aliases']` | Section order, top to bottom. Sections are `values` (Schemas, constants, classes), `interfaces`, `modules` (`declare module`) and `aliases`; a nested list shares one place; a section left out goes anywhere |
| `derived` | `{ first?, sorted? }` | `{ first: true, sorted: true }` | `first`: derived `typeof X.Type` aliases come before the other aliases. `sorted`: they follow Schema order |

```ts
// ❌ rows: {}
export type User = Kysely.Selectable<UserTable>

// ✅ rows: {}
export type UserRecord = Kysely.Selectable<UserTable>
```

```ts
{ files: ['src/**/*.types.ts'], rules: { 'arch/effect-schema-first': ['error', { keep: 'Table$', rows: {} }] } }
```
