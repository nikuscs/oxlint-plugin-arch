# `arch/no-restricted-token`

Restricts identifiers or dotted member accesses to configured owner paths.

## Why

Some tokens belong in one owner file. `RouterClient` stays in the RPC client. `*.insertInto` stays out of query files.

## Examples

❌ Incorrect

```ts
// apps/web/src/hooks/use-client.ts
type Client = RouterClient<Router>
const client = RouterClient
process.platform
db.insertInto('users')
this.db.insertInto('users')
```

✅ Correct

```ts
// apps/web/src/services/rpc.client.ts
type Client = RouterClient<Router>
```

```ts
// apps/web/src/hooks/use-client.ts
import type { RouterClient } from './client.ts'
type Client = OtherClient<Router>
```

Type-only imports of a restricted token are ignored. Uses of that imported name still fail outside owner files. `*.name` matches any receiver, including `this.db` and chained calls. Computed access such as `db['insertInto']` is not a static member and is not matched.

## Options

Configure either a single `token` or a `restrictions` list. The older single form `{ token, allowIn }` still works.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `token` | `string` | none | Identifier name to restrict. Type-only imports are ignored. |
| `restrictions` | object[] | none | List of token or member restrictions. Each item must set `token` or `member`, not both. |
| `allowIn` | `string[]` | `[]` | Filename suffixes where the token is allowed. |
| `allowPathPatterns` | `string[]` | `[]` | Regular expressions for allowed paths. |
| `message` | `string` | none | Extra guidance added to the report. |

Each restriction may set `token` or `member`, plus `allowIn`, `allowPathPatterns`, and `message`.

| Field | What it does |
| --- | --- |
| `token` | An identifier name to restrict. |
| `member` | A dotted member path such as `process.platform`. `*.name` matches any receiver. |
| `allowIn` | Filename suffixes where the token is allowed. |
| `allowPathPatterns` | Regular expressions for allowed paths. |
| `message` | Extra guidance added to the report. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-restricted-token': [
    'error',
    {
      restrictions: [
        { token: 'RouterClient', allowIn: ['/src/services/rpc/rpc.client.ts'] },
        { member: 'process.platform', allowIn: ['/src/runtime.ts'] },
        { member: '*.insertInto', message: 'Queries are read-only; move writes to an action.' },
      ],
    },
  ],
}
```

## Preset

Preset: `rpcClientOwnership` policy, on web files: `RouterClient` in the RPC client owner file, and `createContext` under web `context/` and `components/ui/`.

## Related

- [`arch/no-restricted-constructor`](./no-restricted-constructor.md)
- [`arch/require-paired-call`](./require-paired-call.md)
