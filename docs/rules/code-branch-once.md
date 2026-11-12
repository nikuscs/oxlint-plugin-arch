# arch/code-branch-once

A member compared to a string in `min` or more ternaries in a file. Branch on it once and return a record.

Counts `member === 'text'` and `member !== 'text'` tests, also inside `&&`, `||` and `!`. A bare identifier or `==` is not counted. Every ternary on the subject is reported.

```ts
// ❌
const icon = user.kind === 'admin' ? Crown : User
const label = user.kind === 'admin' ? 'Admin' : 'Member'

// ✅
const { icon, label } = user.kind === 'admin' ? { icon: Crown, label: 'Admin' } : { icon: User, label: 'Member' }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `2` | Smallest number of ternaries on one subject that is reported (at least 2) |

```ts
'arch/code-branch-once': 'error'
'arch/code-branch-once': ['error', { min: 3 }]
```
