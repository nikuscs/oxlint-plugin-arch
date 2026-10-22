# `modules/domain-constants`

Preset-internal rule: move module data to a domain `.constants.ts` file. Do not keep SCREAMING_SNAKE constants (or configured data) in the service file.

## Why

A service's label table belongs in `chat.constants.ts`, not next to the operation. The report names the owner file from the service directory or filename. Use a domain-prefixed name. Do not invent a factory to silence the rule.

With `includeData`, module-level literals, objects, arrays, literal calculations, regexes and seeded `Map`/`Set` tables are treated as data too. Function-local calculations and empty `Map`/`Set` state stay in the owner. This is syntactic, not data-flow analysis.

## Examples

❌ Incorrect

```ts
// apps/server/src/services/chat/chat-action.send.ts
const CHAT_LIMIT = 3

export function chatActionSend() {
  return { retries: CHAT_LIMIT }
}
```

```ts
const labels = new Map([['yes', translate.yes]])
const delay = 3 * 1000
```

✅ Correct

```ts
import { CHAT_LIMIT } from '../../types/chat.constants'

export function constantsActionSend(params: ChatSendParams) {
  return params.text.slice(0, CHAT_LIMIT)
}
```

```ts
export function chatCreate() {
  const defaults = { limit: 3 }
  return defaults
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `includeData` | `boolean` | `false` | Also flag module-level literal, object, array, template, unary/binary data and seeded `Map`/`Set` tables. |
| `allowServiceMethods` | `boolean` | `false` | Skip exported method-only service objects (`export const themeService = { themeApply() { ... } }`). Arrow properties, data fields, getters, spreads and computed keys still fail. |

```ts
// oxlint.config.ts
rules: {
  'modules/domain-constants': ['error', { includeData: true, allowServiceMethods: true }],
}
```

## Preset

Preset: `serviceStructure` policy. Backend `services/**/*.ts` (uppercase constants). Web `services/**/*.{ts,tsx}` with `includeData`. Frontend `.client`/`.server`/`.rsc` entries also set `allowServiceMethods`. Constants files and tests are excluded.

## Related

- [`modules/service-functions`](./service-functions.md)
- [`../arch/only-export-constants`](../arch/only-export-constants.md)
