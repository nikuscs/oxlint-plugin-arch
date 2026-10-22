# `modules/empty-effect`

Preset-internal syntax rule: remove `useEffect` / `useLayoutEffect` callbacks whose body is empty.

## Why

Selector: `useEffect` or `useLayoutEffect` (including `React.useEffect`) whose callback is a function with an empty block. Message: `Remove the empty effect.` An empty effect does no work.

## Examples

❌ Incorrect

```ts
import { useEffect } from 'react'

export function useEmpty() {
  useEffect(() => {}, [])
}
```

✅ Correct

```ts
import { useEffect } from 'react'

export function useEmpty() {
  useEffect(() => {
    document.title = 'Chat'
  }, [])
}
```

## Options

This rule has no options.

## Preset

Preset: `effects` policy, on web source files (UI-kit files excluded).

## Related

- [`modules/memoization`](./memoization.md)
