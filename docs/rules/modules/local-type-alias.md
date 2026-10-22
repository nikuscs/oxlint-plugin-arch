# `modules/local-type-alias`

Preset-internal syntax rule: do not declare type aliases in component and hook files. Use an interface named for the owner, or move derived aliases to domain types.

## Why

Selector: `TSTypeAliasDeclaration`. Message: `Local component/hook contracts use interfaces named for their owner. Derived or reusable aliases belong in domain types; do not substitute an empty interface.` The selector flags every type alias in matched files. Empty interfaces are not this rule's job.

## Examples

❌ Incorrect

```ts
// apps/web/src/components/chats/chat-status.tsx
type ChatStatus = 'idle' | 'sending'

export function ChatStatusView() {
  return <p>Hello</p>
}
```

✅ Correct

```ts
// apps/web/src/components/chats/chat-status.tsx
interface ChatStatusProps {
  status: string
}

export function ChatStatus({ status }: ChatStatusProps) {
  return <p>{status}</p>
}
```

## Options

This rule has no options.

## Preset

Preset: `typePlacement` policy, on web `components/**/*.tsx` and `hooks/**/*.ts` (UI-kit and tests excluded).

## Related

- [`modules/pascal-interface`](./pascal-interface.md)
- [`../arch/component-props`](../arch/component-props.md)
