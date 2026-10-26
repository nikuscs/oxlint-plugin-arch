# arch/boundaries-token-owner

Reports an identifier or member expression outside the files allowed to own it. Type-only imports are ignored.

```tsx
// ❌ features/chat.tsx
import { createContext } from 'react'

export const ChatContext = createContext<Chat | null>(null)

// ✅ features/chat.tsx
import { useContext } from 'react'
import { ChatContext } from '../context/chat-context'

export const useChat = () => useContext(ChatContext)
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `token` | `string` | none | Identifier to restrict |
| `allow` | `string[]` | `[]` | File path suffixes that may use it |
| `patterns` | `string[]` | `[]` | Path regexes that may use it |
| `restrictions` | `object[]` | none | Several rules of `{ token \| member, allow?, patterns?, message? }` |
| `restrictions[].member` | `string` | none | Dotted member like `process.env`, or `*.name` for any object |

```ts
'arch/boundaries-token-owner': ['error', {
  restrictions: [
    { token: 'createContext', patterns: ['/context/'] },
    { member: 'process.env', allow: ['/env.ts'], message: 'Read config from env.ts.' },
  ],
}]
```
