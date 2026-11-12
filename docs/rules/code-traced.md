# arch/code-traced

An exported function or service method built with an untraced helper. Service methods are the properties of an object passed to a `services` method, such as `Mail.of({ send })`; a name is followed to its declaration, and so is a name exported with `export { send }`. `export default` is not checked. `exports` limits the export check by file path; `skip` limits only service methods.

```ts
// ❌
export const send = Effect.fnUntraced(function* () {})

// ✅
export const send = Effect.fn('mail.send')(function* () {})
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `untraced` | `string[]` | `['Effect.fnUntraced']` | Dotted names of the untraced helpers (replaces the default) |
| `exports` | `string \| string[]` | | Regex for file paths whose exports are checked; every file when unset |
| `services` | `string[]` | `['of']` | Methods that build a service from an object |
| `skip` | `string \| string[]` | | Regex for service names to skip, such as `Driver$` |
| `message` | `string` | | Report text; defaults to a hint naming the untraced helpers |

```ts
'arch/code-traced': ['error', { exports: 'src/([^/]+)/\\1[.]ts$', skip: 'Driver$' }]
```
