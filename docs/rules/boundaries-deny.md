# arch/boundaries-deny

Reports imports, re-exports, literal dynamic imports and calls that a folder bans. Import keys are globs over the whole specifier (`*` stays inside one segment, `**` crosses `/`, `{a,b}` is either name, `!(a|b)` is any one segment except those names, where `*` in a name stays inside the segment, so `!(*.layer.ts)` is any segment not ending in `.layer.ts`). Call keys match the callee name, the member name or the dotted name; literal computed keys like `console['log']` count.

`import type` and `export type` are banned like runtime imports. The first matching import key wins; `?` is one character; `**/` also matches zero folders. `new X()` is not a call.

```ts
// ❌ apps/server/src/services/order/order-query.list.ts
import { motion } from 'framer-motion'
await db.insertInto('orders').values(order).execute()

// ✅
const orders = await db.selectFrom('orders').selectAll().execute()
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `imports` | `Record<string, string>` | `{}` | Specifier glob → hint |
| `calls` | `Record<string, string>` | `{}` | Callee name → hint |
| `only` | `{ imports?, calls?, in, message? }[]` | `[]` | Imports and calls used in the `in` places only |

`only` reports its imports and calls in every file outside `in`. `imports`, `calls` and `in` each take one value or a list, and every import is paired with every place. A place is a folder or a file glob, matched from any folder up: `domains/auth`, `src/domains/*/*.config.ts`.

```ts
// only: [{ imports: '@scope/kit-auth', in: 'domains/auth' }]
// ❌ src/domains/order/order.actions.ts
import * as AuthKit from '@scope/kit-auth'

// ✅ src/domains/auth/auth.layer.ts
import * as AuthKit from '@scope/kit-auth'
```

```ts
'arch/boundaries-deny': ['error', {
  imports: { 'framer-motion': 'Use motion/react.', '**/kits': 'Import the kit file.' },
  calls: { insertInto: 'Queries only read.', 'console.log': 'Use the logger.' },
}]
'arch/boundaries-deny': ['error', { imports: { '**/domains/*/!(*.layer.ts|*.workflows.ts)': 'Import the layer file.' } }]
'arch/boundaries-deny': ['error', {
  only: [{ imports: ['@scope/kit-auth', '@scope/kit-auth/*'], in: ['domains/auth', 'application'], message: 'Call the auth domain.' }],
}]
```
