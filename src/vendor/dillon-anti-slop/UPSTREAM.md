# Dillon Mulroy's anti-slop rules

Upstream: https://github.com/dmmulroy/anti-slop

Author: Dillon Mulroy. Licensed under MIT; see LICENSE in this directory.

Most files were copied from an earlier vendored copy of these rules in
another project; its upstream revision has not been established.

`no-array-filter-map`, `no-reduce-accumulator-copy`, `no-known-value-widening`,
`no-object-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`,
`no-unsafe-dictionary-type` and the shared `array-method`, `dictionary-types`,
`signatures` and `type-bindings` helpers follow
upstream revision 13909c9e07590f5a85d93c62712259fe14a883f7 as optimized by
Christoph Nakazawa in `@nkzw/oxlint-config` 3.0.0 (MIT,
https://github.com/nkzw-tech/oxlint-config/tree/main/quality): type bindings
are indexed once per file and checks run at `Program:exit`.
Local fixes: a named class expression's name binds only inside the class,
generic arguments resolve with the substitutions of the scope that wrote them,
a generic alias of a broad key (`Key<T> = string`) counts as a broad key, and a
locally declared `Array` or `ReadonlyArray` type is not array evidence.
`no-widen-then-assert` takes only its candidate filter from that version.

Local packaging changes rename the plugin namespace to `dillon-anti-slop`.
The TanStack preset selects the enabled rules; this directory implements them
and is not a separate preset. Upstream intentionally distributes source for
vendoring and does not publish an official npm package.

Local options: `terms` on `no-shape-in-symbol-names` and `comment` on
`require-safety-comment-for-type-assertion`; their defaults keep upstream behavior.

Local behavior fixes recognize `SAFETY:` comments on exported declarations and
export-default assertions, while retaining statement boundaries for other
assertions.

`no-shape-in-symbol-names` skips names that belong to another API: the
property of a non-computed member access (`schema.shape`), a renamed
destructured property or import, the right side of a qualified type name, and
the key of a shorthand property (its variable is still reported).

Local option changes let `no-module-mocking` take `deny` and `allow` API
patterns and `checkDestructured`, so the preset can also ban stubs such as
`vi.spyOn`. With no options it reports the same calls as before.
