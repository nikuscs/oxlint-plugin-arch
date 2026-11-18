# 🧹 Dillon anti-slop rules

Type-evidence, array-pass and test-double rules by Dillon Mulroy, vendored from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) with faster versions adapted from Christoph Nakazawa's [`@nkzw/oxlint-config`](https://github.com/nkzw-tech/oxlint-config), and registered as the `dillon-anti-slop` plugin.

| Rule | Checks | 🔧 |
| --- | --- | --- |
| [`no-array-filter-map`](#no-array-filter-map) | No `.filter().map()` passes over a known array | |
| [`no-chained-type-assertions`](#no-chained-type-assertions) | No `as X as Y` chains | |
| [`no-conditional-empty-object-spread`](#no-conditional-empty-object-spread) | No `...(cond ? { a } : {})` | |
| [`no-known-value-widening`](#no-known-value-widening) | Known values keep their inferred type | |
| [`no-module-mocking`](#no-module-mocking) | No `vi.mock` or `jest.mock` | |
| [`no-object-parameters`](#no-object-parameters) | No parameters typed `object` | |
| [`no-reduce-accumulator-copy`](#no-reduce-accumulator-copy) | No copying the reducer accumulator on every pass | |
| [`no-reflect-apply`](#no-reflect-apply) | No `Reflect.apply` | |
| [`no-reflect-get`](#no-reflect-get) | No `Reflect.get` | |
| [`no-runtime-typeof`](#no-runtime-typeof) | No runtime `typeof` checks | |
| [`no-shape-in-symbol-names`](#no-shape-in-symbol-names) | No `shape` in symbol names | |
| [`no-unknown-parameters`](#no-unknown-parameters) | No parameters typed `unknown` | |
| [`no-unknown-returns`](#no-unknown-returns) | No `unknown` return types | |
| [`no-unknown-type-aliases`](#no-unknown-type-aliases) | No aliases that resolve to `unknown` | |
| [`no-unsafe-dictionary-type`](#no-unsafe-dictionary-type) | No dictionaries of `unknown`, `any` or `object` | |
| [`no-widen-then-assert`](#no-widen-then-assert) | No widening a value then asserting it back | |
| [`require-safety-comment-for-type-assertion`](#require-safety-comment-for-type-assertion) | Type assertions need a `SAFETY:` comment | |

## no-array-filter-map

Reports a `filter` followed by `map`, or `map` followed by `filter`, on a value known to be an array: a literal, a `const` array, a parameter typed as an array, or the result of an array method. Iterator pipelines and unknown receivers pass. Off in the preset; turn it on in a folder's `rules`.

```ts
// ❌
const emails = users.filter((user) => user.active).map((user) => user.email)

// ✅
const emails = users.values().filter((user) => user.active).map((user) => user.email).toArray()
```

```ts
'dillon-anti-slop/no-array-filter-map': 'error'
```

## no-chained-type-assertions

Reports chained `as` or angle-bracket assertions, including parenthesized chains.

```ts
// ❌
const user = payload as unknown as User

// ✅
const user = UserSchema.parse(payload)
```

```ts
'dillon-anti-slop/no-chained-type-assertions': 'error'
```

## no-conditional-empty-object-spread

Reports object spreads of a conditional with an empty object in either branch. Array spreads are ignored.

```ts
// ❌
const query = { limit, ...(cursor ? { cursor } : {}) }

// ✅
const query: Query = { limit }
if (cursor) query.cursor = cursor
```

```ts
'dillon-anti-slop/no-conditional-empty-object-spread': 'error'
```

## no-known-value-widening

Reports a value with known fields flowing into an explicit broad type such as `unknown`, `object`, `Record<string, unknown>` or an anonymous object type, through a variable, class property, reassignment, return or assertion, and a known argument passed to a type guard whose parameter is `unknown`. An empty `{}` into a dictionary passes, and so does a record unless its key is `string`, `number`, `symbol`, `PropertyKey` or a local alias of one. Aliases are resolved in the scope where they are used.

```ts
// ❌
const config: Record<string, unknown> = { retries: 3, verbose: true }

// ✅
const config = { retries: 3, verbose: true } satisfies Config
```

```ts
'dillon-anti-slop/no-known-value-widening': 'error'
```

## no-module-mocking

Reports Vitest and Jest module mocks (`*.mock`, `*.doMock`, `*.unstable_mockModule`) and any other denied test-double API. `vi` and `jest` are the globals or imports from `vitest` and `@jest/globals`.

```ts
// ❌
vi.mock('./mailer')

// ✅
const mailer = createMemoryMailer()
const service = createSignupService({ mailer })
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `deny` | `(string \| { api, message? })[]` | `['*.mock', '*.doMock', '*.unstable_mockModule']` | APIs to report, as `<vi\|jest\|*>.<method\|*>`; replaces the default list, so list the defaults too |
| `allow` | `string[]` | `[]` | APIs exempt from `deny`; `allow` wins over `deny` |
| `checkDestructured` | `boolean` | `false` | Also check calls of methods destructured as `const { mock } = vi` |

```ts
'dillon-anti-slop/no-module-mocking': ['error', { deny: ['*.mock', '*.doMock', { api: 'vi.spyOn', message: 'Pass a fake instead.' }] }]
'dillon-anti-slop/no-module-mocking': ['error', { allow: ['vi.mock'] }]
```

## no-object-parameters

Reports function parameters typed `object`, directly, through an alias or in a union (`object | null`). Methods, signatures and function types are checked too.

```ts
// ❌
export function save(input: object) {}

// ✅
export function save(input: Draft) {}
```

```ts
'dillon-anti-slop/no-object-parameters': 'error'
```

## no-reduce-accumulator-copy

Reports copying the accumulator inside a `reduce` or `reduceRight` callback with `Object.assign({}, acc)`, `Array.from(acc)` or an array copy method (`concat`, `slice`, `toSpliced`, `toSorted`, `toReversed`, `with`) when the initial value is an array. Spread copies are left to `oxc/no-accumulating-spread`. On in every preset project.

```ts
// ❌
const all = pages.reduce((acc, page) => acc.concat(page.items), [])

// ✅
const all = pages.flatMap((page) => page.items)
```

```ts
'dillon-anti-slop/no-reduce-accumulator-copy': 'error'
```

## no-reflect-apply

Reports calls to the global `Reflect.apply`, including `Reflect['apply']`. A local `Reflect` passes.

```ts
// ❌
Reflect.apply(handler, undefined, args)

// ✅
handler(...args)
```

```ts
'dillon-anti-slop/no-reflect-apply': 'error'
```

## no-reflect-get

Reports calls to the global `Reflect.get`, including `Reflect['get']`. A local `Reflect` passes.

```ts
// ❌
const name = Reflect.get(user, 'name')

// ✅
const name = user.name
```

```ts
'dillon-anti-slop/no-reflect-get': 'error'
```

## no-runtime-typeof

Reports every runtime `typeof` expression. `typeof` in a type position (`type Config = typeof config`) passes.

```ts
// ❌
if (typeof value === 'string') render(value)

// ✅
render(TitleSchema.parse(value))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allowInTypeGuards` | `boolean` | `false` | Allow `typeof` when the nearest enclosing function returns `x is T` |

```ts
'dillon-anti-slop/no-runtime-typeof': ['error', { allowInTypeGuards: true }]
```

## no-shape-in-symbol-names

Reports symbol names containing `shape` in any case.

Names that belong to another API pass: a non-computed member (`schema.shape`), the right side of a qualified type name, a renamed destructured property, import or re-export, and JSX members and attributes. A shorthand key still reports its variable.

```ts
// ❌
interface UserShape { id: string }

// ✅
interface User { id: string }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `terms` | `string[]` | `['shape']` | Substrings, in any case, that symbol names may not hold; replaces `['shape']`, so include it if you still want it. Local addition |

```ts
'dillon-anti-slop/no-shape-in-symbol-names': 'error'
'dillon-anti-slop/no-shape-in-symbol-names': ['error', { terms: ['shape', 'dto'] }]
```

## no-unknown-parameters

Reports parameters typed `unknown`, except ones named `error` or `cause`. Function types and signatures are checked too.

```ts
// ❌
export function handle(payload: unknown) {}

// ✅
export function handle(payload: Order) {}
export function report(error: unknown) {}
```

```ts
'dillon-anti-slop/no-unknown-parameters': 'error'
```

## no-unknown-returns

Reports functions whose declared return type is `unknown` or `Promise<unknown>`, directly, through an alias or in a union.

```ts
// ❌
export async function load(): Promise<unknown> {
  return fetchJson('/api/user')
}

// ✅
export async function load(): Promise<User> {
  return UserSchema.parse(await fetchJson('/api/user'))
}
```

```ts
'dillon-anti-slop/no-unknown-returns': 'error'
```

## no-unknown-type-aliases

Reports type aliases that resolve to `unknown`.

```ts
// ❌
type Payload = unknown

// ✅
type Payload = { id: string }
```

```ts
'dillon-anti-slop/no-unknown-type-aliases': 'error'
```

## no-unsafe-dictionary-type

Reports dictionary types whose value is `unknown`, `any`, `object`, `{}` or a union or alias containing one. Generic constraints (`T extends Record<string, unknown>`) pass.

```ts
// ❌
type Settings = Record<string, unknown>
interface Settings { [key: string]: unknown }

// ✅
type Settings = Record<string, string | number>
```

```ts
'dillon-anti-slop/no-unsafe-dictionary-type': 'error'
```

## no-widen-then-assert

Reports a local `const` declared with a broad type, or widened with `as unknown`, and later asserted back to a narrower one, including in a nested block.

```ts
// ❌
const raw: unknown = { id: 'a' }
const user = raw as User

// ✅
const user: User = { id: 'a' }
```

```ts
'dillon-anti-slop/no-widen-then-assert': 'error'
```

## require-safety-comment-for-type-assertion

Reports `as` and angle-bracket type assertions, other than `as const`, without a `SAFETY:` comment right before the assertion or its statement; a comment before `export` counts.

```ts
// ❌
const input = event.target as HTMLInputElement

// ✅
// SAFETY: the handler is only attached to <input> elements
const input = event.target as HTMLInputElement
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `comment` | `string` | `'SAFETY:'` | Word (with or without `:`) that must appear followed by `:` in a comment before the assertion or its statement. Local addition |

```ts
'dillon-anti-slop/require-safety-comment-for-type-assertion': 'error'
'dillon-anti-slop/require-safety-comment-for-type-assertion': ['error', { comment: 'INVARIANT:' }]
```
