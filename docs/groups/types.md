# 🔷 types

Where types live and what they may hide. On by default.

```ts
folders: {
  'apps/web': { types: { colocated: ['**/env.types.ts'] } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `placement` | `boolean` | `true` | Types in `types/`, interfaces next to their owner |
| `safety` | `boolean` | `true` | No `any`, `unknown`, widening or unchecked assertions |
| `colocated` | `string[]` | `[]` | Globs allowed to hold `*.types.ts` outside `types/` |

Rules: [`arch/code-constructor`](../rules/code-constructor.md), [`arch/code-literal-in`](../rules/code-literal-in.md), [`arch/code-promise-mutation`](../rules/code-promise-mutation.md), [`arch/files-no-functions`](../rules/files-no-functions.md), [`arch/files-restricted`](../rules/files-restricted.md), [`arch/files-types-only`](../rules/files-types-only.md), [`arch/naming-declarations`](../rules/naming-declarations.md), [`arch/naming-types`](../rules/naming-types.md), [`arch/types-declarations`](../rules/types-declarations.md), [`arch/types-imported-alias`](../rules/types-imported-alias.md), [`arch/types-local-alias`](../rules/types-local-alias.md), [`arch/types-service`](../rules/types-service.md), [`arch/types-unknown`](../rules/types-unknown.md), [`dillon-anti-slop/no-chained-type-assertions`](../vendor.md#no-chained-type-assertions), [`dillon-anti-slop/no-conditional-empty-object-spread`](../vendor.md#no-conditional-empty-object-spread), [`dillon-anti-slop/no-known-value-widening`](../vendor.md#no-known-value-widening), [`dillon-anti-slop/no-reflect-apply`](../vendor.md#no-reflect-apply), [`dillon-anti-slop/no-reflect-get`](../vendor.md#no-reflect-get), [`dillon-anti-slop/no-runtime-typeof`](../vendor.md#no-runtime-typeof), [`dillon-anti-slop/no-shape-in-symbol-names`](../vendor.md#no-shape-in-symbol-names), [`dillon-anti-slop/no-unknown-parameters`](../vendor.md#no-unknown-parameters), [`dillon-anti-slop/no-unknown-returns`](../vendor.md#no-unknown-returns), [`dillon-anti-slop/no-unknown-type-aliases`](../vendor.md#no-unknown-type-aliases), [`dillon-anti-slop/no-unsafe-dictionary-type`](../vendor.md#no-unsafe-dictionary-type), [`dillon-anti-slop/no-widen-then-assert`](../vendor.md#no-widen-then-assert), [`dillon-anti-slop/require-safety-comment-for-type-assertion`](../vendor.md#require-safety-comment-for-type-assertion).

Plus `typescript` (2).
