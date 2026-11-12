# arch/backend-orpc-output

Reports a `.handler()` chain without `.output()`, and an `.output()` whose schema is not an identifier or a plain function whose first argument is an identifier. A member call (`z.array(Order)`), a nested call and an inline object are reported.

Any call to a method named `handler` counts as a procedure end, so enable the rule only for files that hold oRPC procedures.

```ts
// ❌
export const getChat = os.input(ChatInput).handler(({ input }) => chats.get(input.id))

// ✅
export const getChat = os.input(ChatInput).output(Chat).handler(({ input }) => chats.get(input.id))
export const listChats = os.output(paged(Chat)).handler(() => chats.list())
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `handler` | `string` | `'handler'` | Method that ends a procedure |
| `output` | `string` | `'output'` | Method that declares the output |

```ts
'arch/backend-orpc-output': 'error'
'arch/backend-orpc-output': ['error', { handler: 'handle', output: 'returns' }]
```
