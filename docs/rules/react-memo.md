# arch/react-memo

Reports `memo`, `useMemo` and `useCallback` imported from `react`, or read as members of a `react` import or the `React` global (a binding from another package or a local `React` passes). `names` and `sources` change the lists. With `sources` that omit `'react'`, the undeclared `React` global is no longer reported.

```tsx
// ❌
import { useMemo } from 'react'

const total = useMemo(() => sum(items), [items])

// ✅
const total = sum(items)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `names` | `string[]` | `['memo', 'useMemo', 'useCallback']` | Imports and members to report; replaces the default |
| `sources` | `string[]` | `['react']` | Modules they come from; replaces the default |
| `message` | `string` | `'Use the React Compiler rather than manual memoization.'` | Report text |

```ts
'arch/react-memo': 'error'
'arch/react-memo': ['error', { sources: ['react', 'preact/compat'] }]
```
