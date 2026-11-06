# arch/code-traced

An exported function or service method built with an untraced helper. Service methods are the properties of an object passed to a `services` method, such as `Mail.of({ send })`; a name is followed to its declaration.

```ts
// ❌
export const send = Effect.fnUntraced(function* () {})

// ✅
export const send = Effect.fn('mail.send')(function* () {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `untraced` | `string[]` | `['Effect.fnUntraced']` | Dotted names of the untraced helpers |
| `exports` | `string \| string[]` | | Regex for file paths whose exports are checked; every file when unset |
| `services` | `string[]` | `['of']` | Methods that build a service from an object |
| `skip` | `string \| string[]` | | Regex for service names to skip, such as `Driver$` |
| `message` | `string` | | Report text |

```ts
'arch/code-traced': ['error', { exports: 'src/([^/]+)/\\1[.]ts$', skip: 'Driver$' }]
```
