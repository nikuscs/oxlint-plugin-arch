# arch/react-props

Reports components whose props are not typed as `interface <Name>Props` (or `suffix`) declared directly above them. Reports inline props, a wrong or missing interface name, an interface not directly above the component (only blank lines between), and (with `prefix`) a missing file prefix.

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
| `prefix` | `boolean` | `false` | Components not exported must start with the file name (`card.tsx`: `CardBadge`); exported ones are exempt. Reported as a rename, before the props checks |
| `suffix` | `string` | `'Props'` | Ending of the props interface name, as in `<Name>Props` |

Components without a parameter, hooks and lowercase functions are skipped. `ComponentProps<'tag'>` and `ComponentProps<typeof X>` used directly pass through; wrapped forms (`Omit<ComponentProps<'button'>, 'type'>`, `PropsWithChildren<…>`, intersections) do not. `memo(...)` and `forwardRef<El, Props>(...)` are followed. A `type` alias named `<Name>Props` fails; it must be an `interface`.

```ts
'arch/react-props': ['error', { prefix: true }]
'arch/react-props': ['error', { suffix: 'Options' }]
```
