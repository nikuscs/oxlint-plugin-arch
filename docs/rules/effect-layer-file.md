# arch/effect-layer-file

A layer file exports `layer` built with Layer, builds its service in one Effect named `make`, and names every other layer `layer<Role>` without exporting it.

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
| `prefix` | `string` | `'layer'` | Prefix of local layer names |
| `builders` | `string[]` | `['Effect.gen', 'Effect.fn', 'Effect.fnUntraced']` | Dotted callee names that build an Effect |
| `layers` | `string \| string[]` | `['^Layer\\.', '^HttpRouter\\.add(?:All)?$', '(?:^\|\\.)layer[^.]*$']` | Regexes on the dotted callee or reference name of a Layer; a `.pipe(...)` call is matched by what it pipes. Change the last one with `prefix` |
| `services` | `string \| string[]` | `['(?:^\|\\.)of$', '^Context\\.']` | Regexes on the callee `make` may return, besides a Layer |
| `constructors` | `string[]` | `['Layer.effect', 'Layer.effectContext', 'Layer.effectDiscard', 'Layer.scoped', 'Layer.scopedContext', 'Layer.scopedDiscard', 'Layer.sync', 'Layer.unwrap']` | Layer constructors that take `make` instead of an inline builder |

```ts
{ files: ['src/**/*.layer.ts'], rules: { 'arch/effect-layer-file': 'error' } }
```
