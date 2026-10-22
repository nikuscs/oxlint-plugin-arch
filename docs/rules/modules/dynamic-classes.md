# `modules/dynamic-classes`

Preset-internal syntax rule: write complete `className` strings. Do not build them with template expressions or `+`.

## Why

Selector: `JSXAttribute[name.name="className"]` on a `TemplateLiteral` with expressions, or on a `BinaryExpression` with `+`. Message: `Write complete class names instead of constructing them dynamically.` Tailwind and shadcn checks need full class tokens.

## Examples

❌ Incorrect

```ts
// apps/web/src/components/chats/chat-dynamic.tsx
export function ChatDynamic({ color }: ChatDynamicProps) {
  return <p className={`bg-${color}`}>Hello</p>
}
```

✅ Correct

```ts
// apps/web/src/components/chats/chat-dynamic.tsx
export function ChatDynamic({ active }: ChatDynamicProps) {
  return <p className={active ? 'p-4' : 'p-2'}>Hi</p>
}
```

## Options

This rule has no options.

## Preset

Preset: `shadcn` policy, on web source files (UI-kit files excluded).

## Related

- [`modules/empty-effect`](./empty-effect.md)
