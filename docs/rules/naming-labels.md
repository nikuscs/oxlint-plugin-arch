# arch/naming-labels

Reports a text label given to a call when it does not follow the name the call is assigned to, or misses `pattern`.

```ts
// { callee: 'Effect.fn', name: '{name}', drop: ['Action', 'Query'], loose: true }
// ❌
export const orderActionScheduleCancel = Effect.fn('order.cancel')(function* () {})

// ✅
export const orderActionScheduleCancel = Effect.fn('order.schedule.cancel')(function* () {})
```

The label is the call's first argument, or with `property` that key of its first object argument. The name is the `const` or class the call ends up in, read through later calls and `.pipe(...)`: `const send = Effect.fn('send')(fn)`, `class Orders extends Context.Service<…>()('key') {}`. A call passed as an argument has no name, so only `pattern` is checked, unless the entry sets `always`: then `name` templates without `{name}` are checked on a call with no name too, so a test block titled after its file works: `layer(AppLayer)('order.delivery', …)` in `order.delivery.test.ts`. A label that is not a plain string is skipped.

In `name`, `{name}` is the name as written (after `drop`) and `{Name}` its PascalCase; `{folder}`, `{parent}`, `{stem}` and `{file}` come from the path, as written. `pattern` takes the same path placeholders in camelCase.

| Entry key | Type | Default | |
| --- | --- | --- | --- |
| `callee` | `string \| string[]` | required | Dotted callee names; `*` is any text (`*.Tagged`) |
| `property` | `string` | none | Read the label from this key of the first object argument |
| `name` | `string \| string[]` | none | Templates the label must equal |
| `pattern` | `string \| string[]` | none | Regexes the label must match |
| `drop` | `string \| string[]` | none | Regexes removed from the name first, such as `'Workflow$'` |
| `loose` | `boolean` | `false` | Compare without case and without `.`, `-`, `_`, `/` |
| `always` | `boolean` | `false` | Check `name` on a call that is not assigned to a name too, such as a statement call; there a template that uses `{name}` is skipped |
| `prefix` | `boolean` | `false` | The label may go on after the name and a space: `'order.delivery while the clock stops'` passes for `'order.delivery'` |
| `message` | `string` | none | Report text for this entry, instead of the rule's `message` |
| `within` | `string \| string[]` | none | A label passed as an argument takes its name from the receiver of that call: with `'*.toLayer'`, `OrderRefundWorkflow.toLayer(Effect.fn('order.refundWorkflow')(…))` is named `OrderRefundWorkflow` |

| Option | Type | Default | |
| --- | --- | --- | --- |
| `labels` | entry list | required | Every entry whose `callee` matches is checked; each needs `name` or `pattern` |
| `message` | `string` | none | Text added to every report |
| `file`, `placeholder` | `string` | none | Path template of the file being linted, like `kit-{module}/src/**`; its placeholders join `{stem}`, `{file}`, `{folder}`, `{parent}` and `{domain}` in `pattern` and `name`, and a file it does not match is skipped |
| `stem`, `singularize`, `roles`, `separators` | | | How `{stem}` and `{domain}` are read, as in [`arch/files-exports`](files-exports.md) |

```ts
'arch/naming-labels': ['error', {
  labels: [
    { callee: 'Effect.fn', name: '{name}', drop: ['Action', 'Query'], loose: true },
    { callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' },
    { callee: 'Context.Service', name: '@app/contract/{folder}/{file}/{name}' },
    { callee: '*.Tagged', property: 'tag', name: '{name}' },
    { callee: '*.Tagged', property: 'code', pattern: '^[A-Z][A-Z0-9_]*$' },
  ],
}]
'arch/naming-labels': ['error', { stem: 'full-basename', roles: ['test'], separators: ['.'], labels: [{ callee: 'layer', name: '{stem}', always: true, prefix: true }] }]
```
