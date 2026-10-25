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
| `message` | `string` | built-in text | Report text |

```ts
'arch/types-local-alias': ['error', { message: 'Local component/hook contracts use interfaces named for...' }]
```
