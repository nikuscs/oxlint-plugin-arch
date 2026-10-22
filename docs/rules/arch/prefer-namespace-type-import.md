# `arch/prefer-namespace-type-import` 🔧

Replaces long type-only named imports with a namespace import and qualifies their references.

## Why

Four or more named type specifiers from one module clutter the import list. A namespace keeps the source once and leaves domain export names unchanged.

## Examples

❌ Incorrect

```ts
import type { A, B as LocalB, C, D } from './room.types'
export type Result = [A, LocalB, C, D]
```

✅ Correct

```ts
import type * as RoomTypes from './room.types'
export type Result = [RoomTypes.A, RoomTypes.B, RoomTypes.C, RoomTypes.D]
```

Up to `max` named specifiers stay named. Both `import type { A, B }` and `import { type A, type B }` are checked. Any runtime, default, or mixed binding leaves the declaration alone.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `max` | `integer` (`>= 0`) | `3` | Maximum named specifiers allowed. Three pass; four fail. |
| `names` | `Record<string, string>` | `{}` | Exact module-path-to-namespace-name map, such as `{ '#/types/room.types': 'RoomTypes' }`. Values must be ASCII binding identifiers, not reserved words. |

```ts
// oxlint.config.ts
rules: {
  'arch/prefer-namespace-type-import': [
    'error',
    { max: 3, names: { './shared.types': 'SharedTypes' } },
  ],
}
```

The default name is the last path segment in PascalCase, stripping JS/TS extensions and adding `Types` unless already present: `#/types/room.types` → `RoomTypes`, `./harness.types.ts` → `HarnessTypes`, `@orbs/server/client` → `ClientTypes`. Other punctuation separates words. Names that start with a digit get a `Module` prefix.

## Autofix

The fix rewrites the import to `import type * as Name from '...'` and updates scope-resolved type references, generics, indexed access, type-position `typeof`, interface heritage, and class implementations, including TSX. Local aliases become the exported name (`LocalB` → `RoomTypes.B`). Shadowed local names are untouched. Exported type declarations are updated.

The fix is skipped (report only) when:

- a comment sits inside the import
- a namespace import from the same module already exists (no merging)
- the proposed name collides with a binding, reference, or another proposed namespace
- the imported name is unsupported
- a reference uses unsupported syntax, including local re-export lists (`export type { A }`, `export { type A }`, `export { A }`)
- more than one qualifying import from the same module would share a name

Direct re-exports from another module are left alone. Fixes preserve the module string, import attributes, semicolon, and comments outside the import. Choose distinct `names` overrides to resolve collisions between different modules.

## Preset

Preset: `imports` policy, on `**/*.{ts,tsx,mts,cts}`, with `{ max: 3 }`.

## Related

- [`arch/no-imported-type-alias`](./no-imported-type-alias.md)
