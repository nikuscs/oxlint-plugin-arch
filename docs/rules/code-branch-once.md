# arch/code-branch-once

A member compared to a string in more than one ternary in a file. Branch on it once and return a record.

```ts
// ❌
const icon = user.kind === 'admin' ? Crown : User
const label = user.kind === 'admin' ? 'Admin' : 'Member'

// ✅
const { icon, label } = user.kind === 'admin' ? { icon: Crown, label: 'Admin' } : { icon: User, label: 'Member' }
```

No options.

```ts
'arch/code-branch-once': 'error'
```
