# `arch/only-export-components`

Allows component files to export only React components and permitted types.

## Why

A focused export surface keeps component modules predictable. Optional filename matching also keeps exported component names aligned with their files.

## Examples

❌ Incorrect

```tsx
// components/example/example-card.tsx
export const exampleComponents = { div: () => <div /> }
```

✅ Correct

```tsx
// components/example/example-card.tsx
export type ExampleCardMode = 'compact'
export function ExampleCard() {
  return <div />
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `matchFileName` | `boolean` | `true` | Requires component export names to match the PascalCase filename or start with that name. |
| `trailingRoles` | `string[]` | `[]` | Removes a listed trailing filename role when matching. For example, `hero.illustration.tsx` accepts `Hero` and `HeroIllustration` prefixes. |
| `allowTypeExports` | `boolean` | `true` | Allows type aliases, interfaces, and type-only exports. |
| `denyTypePattern` | `string \| string[]` | none | Rejects allowed type exports whose names match any regular expression. |

```ts
// oxlint.config.ts
rules: {
  'arch/only-export-components': ['error', {
    matchFileName: true,
    allowTypeExports: true,
    denyTypePattern: 'Props$',
    trailingRoles: ['illustration'],
  }],
}
```

## Preset

Preset: `naming` policy, on component files except UI and test files. It allows type exports and the `illustration` trailing role.

## Related

- [`arch/component-props`](./component-props.md)
- [`arch/route-surface`](./route-surface.md)
