# arch/effect-layer-file

A layer file exports `layer` built with Layer, builds its service in one Effect named `make`, and names every other layer `layer<Role>` (or `<Role>Layer` with `suffix`) without exporting it. `layer` may also be a function that returns a Layer or a Layer pipe.

It reports a missing or non-Layer `layer`, a builder named other than `make`, a second module-level Effect, any other module-level value or function, a misnamed or exported local layer, a `return` in `make` that is not the service (`Tag.of(...)`, a Context or a Layer), and an inline Effect or function passed to a layer constructor. The group does not enable it: scope it to your layer files in your Oxlint config.

```ts
// ❌
const maxRetries = 3
export const layer = Layer.effect(Users, Effect.gen(function* () {
  return { find }
}))

// ✅
const make = Effect.gen(function* () {
  return Users.of({ find })
})

export const layer = Layer.effect(Users, make)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `layer` | `string` | `'layer'` | Name of the exported layer |
| `make` | `string` | `'make'` | Name of the Effect that builds the service |
| `prefix` | `string` | `'layer'`, `''` with `suffix` | Prefix of local layer names |
| `suffix` | `string` | | Suffix of local layer names, such as `'Layer'` for `<Role>Layer`; it also adds `(?:^\|\.)\w+<suffix>$` to the default `layers` |
| `builders` | `string[]` | `['Effect.gen', 'Effect.fn', 'Effect.fnUntraced']` | Dotted callee names that build an Effect; replaces the default |
| `layers` | `string \| string[]` | `['^Layer\\.', '^HttpRouter\\.add(?:All)?$', '(?:^\|\\.)layer[^.]*$']` | Regexes on the dotted callee or reference name of a Layer; a `.pipe(...)` call is matched by what it pipes. Set it to match your own prefix |
| `services` | `string \| string[]` | `['(?:^\|\\.)of$', '^Context\\.']` | Regexes on the callee a top-level `return` in `make` may return, besides a Layer; replaces the default |
| `constructors` | `string[]` | `['Layer.effect', 'Layer.effectContext', 'Layer.effectDiscard', 'Layer.scoped', 'Layer.scopedContext', 'Layer.scopedDiscard', 'Layer.sync', 'Layer.unwrap']` | Layer constructors that take `make` instead of an inline builder; replaces the default |

```ts
{ files: ['src/**/*.layer.ts'], rules: { 'arch/effect-layer-file': 'error' } }
{ files: ['src/**/*.layer.ts'], rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } }
```
