# Dillon Mulroy's anti-slop rules

Upstream: https://github.com/dmmulroy/anti-slop

Author: Dillon Mulroy. Licensed under MIT; see LICENSE in this directory.

These files were copied from an earlier vendored copy of these rules in
another project.
The original upstream revision of that copy has not been established. This is
not a fresh copy of upstream main and must not be described as one.

Local packaging changes rename the plugin namespace to `dillon-anti-slop`.
The TanStack preset selects the enabled rules; this directory implements them
and is not a separate preset. Upstream intentionally distributes source for
vendoring and does not publish an official npm package.

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
