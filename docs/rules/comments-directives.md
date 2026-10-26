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

```ts
'arch/comments-directives': 'error'
```
