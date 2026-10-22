# Application conventions

The structure the preset enforces. Back to the [preset overview](README.md).

## Layout

```
apps/server/src/
  services/chat/
    chat.service.ts                 makeChatService (factory, injected deps)
    chat-action.send-message.ts     chatActionSendMessage (one operation)
    chat-query.list.ts              chatQueryList
    chat.utils.ts                   chatFormatTitle (shared helpers, chat* prefix)
    chat.constants.ts               CHAT_PAGE_SIZE
  types/chat.types.ts               types and Zod schemas
  rpc/                              handlers, no database calls

apps/web/src/
  components/chat/chat-panel.tsx    ChatPanel + interface ChatPanelProps
  hooks/use-chat.ts                 useChat
  services/chat/
    chat.client.ts                  browser code
    chat.server.ts                  server code
    chat.rsc.tsx                    RSC entries (Next)
    chat-action.send.client.ts      chatActionSend
  types/chat.types.ts               runtime-free types
  lib/                              portable code, no app imports
  routes/                           wiring only (TanStack Start)
```

## Style

- Single quotes, semicolons, 2 spaces. Change with [`formatting`](options.md#general).
- 160-character lines, 400-line files, braced multiline control flow, early returns.
- `Promise.all` arrays and call objects with 3+ properties go one item per line. Method chains are not forced.

## Services

| File | Exports | Helpers |
| --- | --- | --- |
| Backend `domain-action.name.ts` / `domain-query.name.ts` | Exactly one operation, named from the file | Nested inside the operation only |
| Backend `.service.ts` | The factory and its `Service` type | None at module level |
| Frontend `.client.ts`, `.server.ts`, `.rsc.{ts,tsx}` | Several `domain`-prefixed operations | Nested inside an operation |
| Frontend `domain-action.name.client.ts` | Exactly one operation, without the runtime suffix | Nested inside the operation |
| `domain.utils.ts` | Shared domain helpers | All functions keep the domain prefix |

❌ Module-level helper in an operation file:

```ts
// chat-action.send-message.ts
function chatTrim(text: string) { return text.trim() }
export function chatActionSendMessage({ text }: ChatSendParams) { return chatTrim(text) }
```

✅ Nested:

```ts
export function chatActionSendMessage({ text }: ChatSendParams) {
  const chatTrim = (value: string) => value.trim()
  return chatTrim(text)
}
```

Frontend method objects also count as operations:

```ts
// theme.client.ts
export const themeService = {
  themeApply(theme: Theme): void {
    document.documentElement.dataset.theme = theme.name
  },
}
```

Only a nonempty object of methods with static, domain-prefixed keys qualifies. No data fields, getters, spreads, computed keys or arrow properties.

Options for [`modules/service-functions`](../rules/modules/service-functions.md) (`frontend`, `allowLocalHelpers`, `allowReturnedMethods`, `singleExport`, `message`) are set through `policies.serviceStructure`.

## Types and schemas

- Types live in `types/*.types.ts`. Type and constant files have no top-level functions.
- Backend `types/` owns Zod schemas. Web `types/` is runtime-free.
- No backend root: Next web `types/` may build schemas.
- Components and hooks use local `interface` types; other types go to `types/`.
- Exceptions: [colocated type files](exceptions.md#type-files-next-to-their-code).

## Constants

Module data goes in `domain.constants.ts`, with the domain prefix:

```ts
// ❌ chat.client.ts
const PAGE_SIZE = 20

// ✅ chat.constants.ts
export const CHAT_PAGE_SIZE = 20
```

Frontend services also catch literal objects, arrays, calculations and seeded `Map`/`Set` tables. Empty `Map`/`Set` state and function-local values are fine.

## React

- Components: one group folder, file prefix in names, `interface XProps` directly above each component.
- Routes and pages compose components: no `useState`/`useEffect`/`useMutation`, no raw HTML.
- `useForm` needs the schema resolver. `createContext` lives in an owner folder.
- Effects cannot replace derived values or event handlers. Empty effects fail.
- React Compiler is assumed: no `memo`, `useMemo`, `useCallback` (see [`react.compiler`](options.md#react-tailwind-and-shadcn)).
- No new object/function props in render; no `tabIndex` on non-interactive elements. Test IDs are allowed.

## Boundaries

- Web code imports the backend only through `imports.backendEntryPoints`.
- `src/lib/` is portable: no app services or app package imports, even type-only. It may type-import its own `types/<module>.types.ts` (`lib/fade.ts` → `types/fade.types.ts`).
- Packages cannot import app internals.
- RPC handlers delegate database work to services. Service dependencies are injected.

## Safety

- No `unknown`/`any`, chained assertions, or assertions without a `SAFETY:` comment.
- No loose dictionaries, module mocks or shared mutable module state.
- No focused, skipped or placeholder tests.
- Comments only as directives, `SAFETY:` notes or explicit exceptions. Type and constant files allow no `SAFETY:` comments.
- `console` only in `scripts` roots and `cliFiles`.
- Rejection callbacks must not take an implicit `any`; omit the parameter instead.

## Custom file roles

```ts
modules: { customFileRoles: ['prompts'] }
```

- `route.prompts.ts` may hold several builders. Every function starts with `routePrompts`.
- Built-in roles cannot be reused: `service`, `client`, `server`, `rsc`, `utils`, `action`, `query`, `types`, `constants`, `handler`, `test`, `spec`.
- Private role files are importable only inside their own domain. Other domains use the service API (`.service`, `.client`, `.server`, `.rsc`), `.utils`, types or constants.
- Public service and utility files cannot re-export private files.
