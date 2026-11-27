# arch/code-inside

Reports a call made inside the callback of another call that bans it.

```ts
// { callee: '*.transaction', calls: { '*Workflow.execute': 'Start the workflow after the commit.' } }
// ❌
yield* db.transaction(Effect.fn(function* () {
  yield* OrderRefundWorkflow.execute({ orderId })
}))

// ✅
yield* db.transaction(save)
yield* OrderRefundWorkflow.execute({ orderId })
```

Both sides are dotted names where `*` is any text. A call is inside when it sits in a function passed as an argument of the outer call, at any depth, also through wrapper calls such as `Effect.gen(function* () {})` or `Effect.fn('name')(function* () {})`; a call in the outer call's own arguments is not.

| Entry key | Type | |
| --- | --- | --- |
| `callee` | `string \| string[]` | The outer calls, such as `*.transaction` |
| `calls` | `Record<string, string>` | Banned call → hint |

| Option | Type | Default | |
| --- | --- | --- | --- |
| `inside` | entry list | required | |

```ts
'arch/code-inside': ['error', { inside: [{ callee: '*.transaction', calls: { '*.send': 'Send after the commit.', fetch: 'No network call in a transaction.' } }] }]
```
