# `modules/service-functions`

Preset-internal rule: keep backend operations strict. Frontend modules may expose several operations, with helpers nested inside them.

## Why

Default contract: no private helpers. Keep the existing factory or operation. Domain `.utils.ts` is only for genuinely shared logic. Do not add a fake factory or public helper export.

`frontend: true` allows multiple public domain operations. Operation-only helpers stay inside their public operation. File-level private functions are forbidden. `singleExport: true` still requires exactly one named operation and forbids extra exports, types, constants and re-exports.

Action/query files export exactly one named operation. Helpers used only by that operation may be private nested functions or arrows inside it. Module-level private helpers still fail. Backend service files retain the stricter helper policy.

Frontend `.client.ts`, `.server.ts` and `.rsc.{ts,tsx}` entries are cohesive modules: multiple public domain-prefixed operations are allowed. A nonempty method-only object such as `export const themeService = { themeApply(...) { ... } }` also counts as public operations in frontend mode.

## Examples

❌ Incorrect

```ts
function helperBuild() {
  return 1
}

export function helperActionSend() {
  return { count: helperBuild() }
}
```

```ts
export function chatActionSend() {
  function helper() {}
}
```

✅ Correct

```ts
export function helperActionSend(params: ChatSendParams) {
  return params.items.map((item) => item.id)
}
```

```ts
// frontend: true
export function chatRead() {
  function chatNormalize() {
    return 1
  }
  return chatNormalize() + 1
}
```

```ts
// allowLocalHelpers + singleExport
export function run() {
  const format = () => 1
  return format() + 2
}
```

## Options

Booleans default to `false` outside the preset's scoped overrides.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `frontend` | `boolean` | `false` | Allow several public operations and helpers nested inside them. |
| `allowLocalHelpers` | `boolean` | `false` | Allow nested helpers inside the one exported operation. Implied by `frontend`. |
| `allowReturnedMethods` | `boolean` | `false` | Allow nested functions that the operation returns as object methods. |
| `singleExport` | `boolean` | `false` | Require exactly one named runtime export. |
| `message` | `string` | contract-specific | Replace the diagnostic text without turning the rule off. |

```ts
// oxlint.config.ts
rules: {
  'modules/service-functions': ['error', {
    allowLocalHelpers: true,
    singleExport: true,
    message: 'Keep one operation; keep local helpers inside it.',
  }],
}
```

## Preset

Preset: `serviceStructure` policy, on app `services/**`. Frontend `.client`/`.server`/`.rsc` entries use `{ frontend: true }`. Action/query files use `{ allowLocalHelpers: true, singleExport: true }`. Concept roles from `modules.customFileRoles` turn this rule off in those files.

## Related

- [`modules/service-types`](./service-types.md)
- [`../arch/no-trivial-functions`](../arch/no-trivial-functions.md)
- [`../arch/export-file-prefix`](../arch/export-file-prefix.md)
