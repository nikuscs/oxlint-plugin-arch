# arch/backend-orpc-output

Reports a `.handler()` chain without `.output()`, and an `.output()` whose schema is not an identifier or a plain function whose first argument is an identifier. A member call (`z.array(Order)`), a nested call and an inline object are reported.

Any call to a method named `handler` counts as a procedure end, so enable the rule only for files that hold oRPC procedures.

With `roots`, contract procedures are checked too: a call chain that nothing else is chained on, whose path starts with a root, must call every `require` method. The path is the names and methods with the call arguments left out: `read.meta(a).input(b)` is `read.meta.input`, `Kit.contract({}).meta(a)` is `Kit.contract.meta`. A method called inside an argument does not count, and a chain that calls an `ignore` method is not a procedure. Every chain from a root counts, so enable `roots` only on contract files and keep shared bases in another file.

```ts
// { roots: ['read', 'write'], require: ['output', 'meta'] }
// ❌
export const OrderContract = {
  list: read.input(OrderListInput),
}

// ✅
export const OrderContract = {
  list: read.meta(openapi({ summary: 'List orders' })).input(OrderListInput).output(OrderListOutput),
}
```

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
| `roots` | `string[]` | none | Dotted names a contract procedure chain starts with, such as `['oc']`; without it contract chains are not checked |
| `require` | `string[]` | `[output]` | Methods every contract procedure calls |
| `ignore` | `string[]` | `['router']` | Methods that mark a chain as something other than a procedure |
| `message` | `string` | none | Text added to every report |

```ts
'arch/backend-orpc-output': 'error'
'arch/backend-orpc-output': ['error', { handler: 'handle', output: 'returns' }]
'arch/backend-orpc-output': ['error', { roots: ['read', 'write', 'destructive'], require: ['output', 'meta'] }]
```
