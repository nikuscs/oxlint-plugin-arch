# Dillon Mulroy's anti-slop rules

Upstream: https://github.com/dmmulroy/anti-slop

Author: Dillon Mulroy. Licensed under MIT; see LICENSE in this directory.

These files were copied from the existing vendored rules in
`/Users/jon/projects/orbs/packages/tooling/src/oxlint/anti-slop`.
The original upstream revision of that copy has not been established. This is
not a fresh copy of upstream main and must not be described as one.

Local packaging changes rename the plugin namespace to `dillon-anti-slop`.
The TanStack preset selects the enabled rules; this directory implements them
and is not a separate preset. Upstream intentionally distributes source for
vendoring and does not publish an official npm package.

Local behavior fixes recognize `SAFETY:` comments on exported declarations and
export-default assertions, while retaining statement boundaries for other
assertions. Covered by `src/tests/safety-comment.test.ts` and preset fixtures.
