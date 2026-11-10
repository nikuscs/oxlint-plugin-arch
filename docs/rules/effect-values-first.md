# arch/effect-values-first

In a file and inside each top-level function or Effect builder, values come first, then helpers and methods.

A helper is an inline function, a function declaration or a `builders` call such as `Effect.gen`. A value declared after the first helper is reported unless it reads a helper or a value built from one, or its call or reference matches `pinned` (layers, services, decoders). A statement that runs code after the first helper, or a pinned step that yields, fixes the order of everything after it.

```ts
// ❌
const findUser = Effect.fn('Users.find')(function* (id: string) {})
const maxRetries = 3

// ✅
const maxRetries = 3
const findUser = Effect.fn('Users.find')(function* (id: string) {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `builders` | `string[]` | `['Effect.gen', 'Effect.fn', 'Effect.fnUntraced']` | Dotted callee names that build a lazy Effect; curried `Effect.fn('name')(...)` counts |
| `pinned` | `string \| string[]` | `['^Layer\\.', '^Context\\.', '^HttpRouter\\.add(?:All)?$', '(?:^\|\\.)of$', '(?:^\|\\.)layer[^.]*$', '^Schema\\.(?:asserts\|decode\\w*\|encode\\w*\|is\|isSchema\|isSchemaError\|resolveAnnotations)$']` | Regexes on the dotted callee or reference name of values that may follow helpers; a `.pipe(...)` call is matched by what it pipes |

```ts
'arch/effect-values-first': ['error', { builders: ['Effect.gen', 'Effect.fn'] }]
```
