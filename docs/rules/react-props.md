# arch/react-props

Reports components whose props are not typed as `interface <Name>Props` declared directly above them.

```tsx
// ❌
export function Button({ label }: { label: string }) {
  return <button>{label}</button>
}

// ✅
interface ButtonProps {
  label: string
}

export function Button({ label }: ButtonProps) {
  return <button>{label}</button>
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `prefix` | `boolean` | `false` | Local components must start with the file name |

```ts
'arch/react-props': ['error', { prefix: true }]
```
