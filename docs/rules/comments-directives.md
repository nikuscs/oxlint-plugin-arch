# arch/comments-directives

An `oxlint-disable` or `eslint-disable` comment that names no rule or gives no reason after `--`.

```ts
// ❌
// oxlint-disable-next-line
run(input as never)

// ✅
// oxlint-disable-next-line no-explicit-any -- third-party callback type
run(input as never)
```

Covers `oxlint-disable`, `eslint-disable` and their `-line` and `-next-line` forms in line and block comments. The reason may contain `--`. TypeScript directives are not checked.

No options.

```ts
'arch/comments-directives': 'error'
```
