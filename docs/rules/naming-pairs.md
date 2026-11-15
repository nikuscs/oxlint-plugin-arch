# arch/naming-pairs

Two calls of one chain take values that share a name, such as a procedure's input and output.

```ts
// { methods: ['input', 'output'], strip: ['Input$', 'Output$'] }
// ❌
read.input(Schemas.ToolResultSessionInput).output(Schemas.ToolSessionOutput)

// ✅
read.input(Schemas.ToolSessionInput).output(Schemas.ToolSessionOutput)
```

Each name is the last part of the first argument (`Schemas.OrderListInput` is `OrderListInput`); `strip` removes what is expected to differ, and what is left must be equal. A side that is missing, or whose argument is not a name (`Schema.Void`, `Schema.Array(Order)`), is skipped.

| Entry key | Type | Default | |
| --- | --- | --- | --- |
| `methods` | `[string, string]` | required | The two method names of the chain |
| `strip` | `string \| string[]` | none | Regexes removed from both names before comparing |
| `allow` | `string \| string[]` | none | Regexes for names that pair with anything, such as shared ones (`'^Accepted$'`, `'IdInput$'`) |
| `message` | `string` | none | Report text for this pair, instead of the rule's `message` |

| Option | Type | Default | |
| --- | --- | --- | --- |
| `pairs` | entry list | required | |
| `message` | `string` | none | Text added to every report |

```ts
'arch/naming-pairs': ['error', { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'], allow: ['^Accepted$'] }] }]
```
