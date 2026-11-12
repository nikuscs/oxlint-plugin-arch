# arch/types-local-alias

Reports every `type` alias; local contracts use an interface named for their owner.

```ts
// ❌
type ButtonProps = { label: string }

// ✅
interface ButtonProps {
  label: string
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `allow` | `string \| string[]` | none | Regexes tested against the alias name; a match may stay |
| `message` | `string` | `'Local component/hook contracts use interfaces named for their owner. Derived or reusable aliases belong in domain types; do not substitute an empty interface.'` | Report text |

```ts
'arch/types-local-alias': ['error', { allow: 'Variant$' }]
```
