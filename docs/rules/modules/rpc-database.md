# `modules/rpc-database`

Preset-internal syntax rule: RPC handlers must not call the database. Delegate that work to services.

## Why

Selector: `CallExpression` whose callee property is `selectFrom`, `insertInto`, `updateTable`, `deleteFrom`, `mergeInto` or `executeQuery`. Message: `RPC handlers delegate database work to services.`

## Examples

❌ Incorrect

```ts
// apps/server/src/rpc/private-query.ts
export const rows = database.selectFrom('messages')
```

✅ Correct

```ts
// apps/server/src/rpc/private-query.ts
export const endpoint = os.handler(() => chatService.list())
```

## Options

This rule has no options.

## Preset

Preset: `boundaries` policy, on backend `rpc/**/*.ts`.

## Related

- [`modules/import-boundaries`](./import-boundaries.md)
- [`modules/service-functions`](./service-functions.md)
