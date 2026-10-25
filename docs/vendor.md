# 🧹 Dillon anti-slop rules

Type-evidence and test-double rules by Dillon Mulroy, vendored from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) and registered as the `dillon-anti-slop` plugin.

| Rule | Checks | 🔧 |
| --- | --- | --- |
| [`no-chained-type-assertions`](#no-chained-type-assertions) | No `as X as Y` chains | |
| [`no-conditional-empty-object-spread`](#no-conditional-empty-object-spread) | No `...(cond ? { a } : {})` | |
| [`no-known-value-widening`](#no-known-value-widening) | Known values keep their inferred type | |
| [`no-module-mocking`](#no-module-mocking) | No `vi.mock` or `jest.mock` | |
| [`no-object-parameters`](#no-object-parameters) | No parameters typed `object` | |
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

Reports object spreads of a conditional that falls back to an empty object.

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

Reports a known value assigned to an explicit broad type such as `unknown`, `object`, `Record<string, unknown>` or an anonymous object type.

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

Reports Vitest and Jest module mocks (`*.mock`, `*.doMock`, `*.unstable_mockModule`) and any other denied test-double API.

```ts
// ❌
vi.mock('./mailer')

// ✅
const mailer = createMemoryMailer()
const service = createSignupService({ mailer })
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `deny` | `(string \| { api, message? })[]` | `['*.mock', '*.doMock', '*.unstable_mockModule']` | APIs to report, as `<vi\|jest\|*>.<method\|*>` |
| `allow` | `string[]` | `[]` | APIs exempt from `deny` |
| `checkDestructured` | `boolean` | `false` | Also check `const { mock } = vi` calls |

```ts
'dillon-anti-slop/no-module-mocking': ['error', { deny: ['*.mock', '*.doMock', { api: 'vi.spyOn', message: 'Pass a fake instead.' }] }]
```

## no-object-parameters

Reports function parameters typed `object`, directly or through an alias.

```ts
// ❌
export function save(input: object) {}

// ✅
export function save(input: Draft) {}
```

```ts
'dillon-anti-slop/no-object-parameters': 'error'
```

## no-reflect-apply

Reports calls to the global `Reflect.apply`.

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

Reports calls to the global `Reflect.get`.

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

Reports every runtime `typeof` expression.

```ts
// ❌
if (typeof value === 'string') render(value)

// ✅
render(TitleSchema.parse(value))
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allowInTypeGuards` | `boolean` | `false` | Allow `typeof` inside functions returning `x is T` |

```ts
'dillon-anti-slop/no-runtime-typeof': ['error', { allowInTypeGuards: true }]
```

## no-shape-in-symbol-names

Reports symbol names containing `shape` in any case.

```ts
// ❌
interface UserShape { id: string }

// ✅
interface User { id: string }
```

```ts
'dillon-anti-slop/no-shape-in-symbol-names': 'error'
```

## no-unknown-parameters

Reports parameters typed `unknown`, except ones named `error` or `cause`.

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

Reports functions whose declared return type is `unknown` or `Promise<unknown>`.

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

Reports dictionary types whose value is `unknown`, `any`, `object`, `{}` or a union or alias containing one.

```ts
// ❌
type Settings = Record<string, unknown>

// ✅
type Settings = Record<string, string | number>
```

```ts
'dillon-anti-slop/no-unsafe-dictionary-type': 'error'
```

## no-widen-then-assert

Reports a local `const` declared with a broad type and later asserted back to a narrower one.

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

Reports type assertions, other than `as const`, without a `SAFETY:` comment right before the assertion or its statement.

```ts
// ❌
const input = event.target as HTMLInputElement

// ✅
// SAFETY: the handler is only attached to <input> elements
const input = event.target as HTMLInputElement
```

```ts
'dillon-anti-slop/require-safety-comment-for-type-assertion': 'error'
```
