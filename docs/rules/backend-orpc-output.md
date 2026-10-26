# arch/backend-orpc-output

Reports a `.handler()` chain without `.output()`, and an `.output()` whose schema is not an identifier or a configured composer called with one.

```ts
// ❌
export const getChat = os.input(ChatInput).handler(({ input }) => chats.get(input.id))

// ✅
export const getChat = os.input(ChatInput).output(Chat).handler(({ input }) => chats.get(input.id))
export const listChats = os.output(paged(Chat)).handler(() => chats.list())
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `composers` | `string[]` | required | Functions that wrap a named schema, like `paged` |
| `handler` | `string` | `'handler'` | Method that ends a procedure |
| `output` | `string` | `'output'` | Method that declares the output |

```ts
'arch/backend-orpc-output': ['error', { composers: ['paged'] }]
```
