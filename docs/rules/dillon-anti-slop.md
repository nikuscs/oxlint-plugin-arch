# `dillon-anti-slop/*` rules

Dillon Mulroy's [anti-slop](https://github.com/dmmulroy/anti-slop) rules, vendored in this package under the `dillon-anti-slop/*` namespace (MIT, see [`UPSTREAM.md`](../../src/rules/dillon-anti-slop/UPSTREAM.md)). They catch low-evidence TypeScript patterns inside functions. Upstream owns their behavior, so this page only lists them; read the rule source for details.

Register them without the preset:

```ts
jsPlugins: [{ name: 'dillon-anti-slop', specifier: 'oxlint-plugin-arch/rules/dillon-anti-slop' }],
rules: { 'dillon-anti-slop/no-chained-type-assertions': 'error' },
```

| Rule | What it enforces |
| --- | --- |
| [`no-chained-type-assertions`](../../src/rules/dillon-anti-slop/rules/no-chained-type-assertions.ts) | Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains. |
| [`no-conditional-empty-object-spread`](../../src/rules/dillon-anti-slop/rules/no-conditional-empty-object-spread.ts) | Disallow object spreads that conditionally spread an empty object to omit fields. |
| [`no-known-value-widening`](../../src/rules/dillon-anti-slop/rules/no-known-value-widening.ts) | Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence. |
| [`no-module-mocking`](../../src/rules/dillon-anti-slop/rules/no-module-mocking.ts) | Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces. |
| [`no-object-parameters`](../../src/rules/dillon-anti-slop/rules/no-object-parameters.ts) | Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary. |
| [`no-reflect-apply`](../../src/rules/dillon-anti-slop/rules/no-reflect-apply.ts) | Disallow Reflect.apply; call typed functions directly or model dynamic dispatch behind an interface. |
| [`no-reflect-get`](../../src/rules/dillon-anti-slop/rules/no-reflect-get.ts) | Disallow Reflect.get; use typed property access or parse dynamic input into a domain type. |
| [`no-runtime-typeof`](../../src/rules/dillon-anti-slop/rules/no-runtime-typeof.ts) | Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary. |
| [`no-shape-in-symbol-names`](../../src/rules/dillon-anti-slop/rules/no-shape-in-symbol-names.ts) | Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names. |
| [`no-unknown-parameters`](../../src/rules/dillon-anti-slop/rules/no-unknown-parameters.ts) | Disallow explicitly unknown function parameters except `error` and `cause`; decode unknown input at its I/O boundary instead. |
| [`no-unknown-returns`](../../src/rules/dillon-anti-slop/rules/no-unknown-returns.ts) | Disallow functions whose explicit return contract is unknown or Promise<unknown>. |
| [`no-unknown-type-aliases`](../../src/rules/dillon-anti-slop/rules/no-unknown-type-aliases.ts) | Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary. |
| [`no-unsafe-dictionary-type`](../../src/rules/dillon-anti-slop/rules/no-unsafe-dictionary-type.ts) | Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches. |
| [`no-widen-then-assert`](../../src/rules/dillon-anti-slop/rules/no-widen-then-assert.ts) | Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type. |
| [`require-safety-comment-for-type-assertion`](../../src/rules/dillon-anti-slop/rules/require-safety-comment-for-type-assertion.ts) | Require a nearby SAFETY comment for every TypeScript type assertion except const assertions. |
