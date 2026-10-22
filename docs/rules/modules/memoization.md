# `modules/memoization`

Preset-internal rule: do not import or call React `memo`, `useMemo` or `useCallback`. Use the React Compiler. Unrelated `cache.memo` calls are left alone.

## Why

Named imports from `react` are reported, including aliases. Namespace and default imports are tracked so `React.memo` and `UI.useCallback` fail too. Member calls on other objects are not React memoization.

## Examples

❌ Incorrect

```ts
import { useMemo } from 'react'

export function useCache() {
  return useMemo(() => 1, [])
}
```

```ts
import * as UI from 'react'
UI.memo(Component)
```

✅ Correct

```ts
import { useState } from 'react'

export function useCache() {
  const [value] = useState(1)
  return value + 1
}
```

```ts
cache.memo(value)
```

## Options

This rule has no options.

## Preset

Preset: `memoization` policy, on web source files (UI-kit files excluded). Enabled when `react.compiler` is not `false`.

## Related

- [`modules/empty-effect`](./empty-effect.md)
