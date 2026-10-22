# `arch/component-props`

Requires each top-level React component with props to use an `interface <Component>Props` declared directly above it.

## Why

Named and colocated props interfaces make component contracts easy to find. The rule ignores components without parameters, hooks, and functions that do not return JSX.

## Examples

❌ Incorrect

```tsx
// components/probe/probe-card.tsx
export function ProbeCard({ title }: { title: string }) {
  return <h2>{title}</h2>
}
```

✅ Correct

```tsx
// components/probe/probe-card.tsx
interface ProbeCardProps {
  title: string
}

export function ProbeCard({ title }: ProbeCardProps) {
  return <h2>{title}</h2>
}
```

A pass-through component may use plain `ComponentProps<'header'>` or `ComponentProps<typeof Button>`. A component that adds, omits, or intersects props must use its named interface. The rule unwraps `memo` and `forwardRef`, including the props type in `forwardRef<Ref, Props>`.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filePrefix` | `boolean` | `false` | Requires local component names to start with the filename prefix, so their props interface follows the same prefix. |

```ts
// oxlint.config.ts
rules: {
  'arch/component-props': ['error', { filePrefix: true }],
}
```

This rule has no autofix because moving or creating an interface changes code structure.

## Preset

Preset: `typePlacement` policy, on component files except UI and test files. It uses `filePrefix: true` and can be disabled with `react.componentProps: false`.

## Related

- [`arch/only-export-components`](./only-export-components.md)
- [`arch/jsx-attributes-multiline`](./jsx-attributes-multiline.md)
