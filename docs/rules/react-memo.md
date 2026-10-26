# arch/react-memo

Reports `memo`, `useMemo` and `useCallback` imported from `react` or used as a member of a `react` default or namespace import, or of an undeclared `React` global.

```tsx
// ❌
import { useMemo } from 'react'

const total = useMemo(() => sum(items), [items])

// ✅
const total = sum(items)
```

```ts
'arch/react-memo': 'error'
```
