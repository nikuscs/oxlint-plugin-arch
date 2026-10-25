# arch/boundaries-deny

Reports imports, re-exports, literal dynamic imports and calls that a folder bans. Import keys are globs over the whole specifier (`*` stays inside one segment, `**` crosses `/`). Call keys match the callee name, the member name or the dotted name; literal computed keys like `console['log']` count.

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

```ts
'arch/boundaries-deny': ['error', {
  imports: { 'framer-motion': 'Use motion/react.', '**/kits': 'Import the kit file.' },
  calls: { insertInto: 'Queries only read.', 'console.log': 'Use the logger.' },
}]
```
