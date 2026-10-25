# arch/react-memo

Reports `memo`, `useMemo` and `useCallback` imported from `react` or used as `React.*`.

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
