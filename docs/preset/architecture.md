# Architecture

Map app roots to roles. Back to the [preset overview](README.md).

```ts
export default preset({
  root: import.meta.dirname,
  architecture: {
    'apps/web': 'web',
    'apps/server': 'server',
    scripts: 'scripts',
    packages: 'packages',
  },
});
```

This is the default. Passing `architecture` replaces it. Keys are app roots, not `src` folders.

## Roles

| Role | Code in | Gets |
| --- | --- | --- |
| `web` | `<root>/src` | React, routes, components, hooks, frontend services, Tailwind, shadcn. |
| `server` | `<root>/src` | Strict backend: services, RPC, schemas, public client entry point. |
| `runner` | `<root>/src` | Same as `server`, for another backend (worker, daemon). |
| `scripts` | `<root>` | Console output allowed. |
| `packages` | `<root>` | No app layout; cannot import app internals. |

- Several apps can share a role: `{ 'apps/dashboard': 'web', 'apps/store': 'web', 'apps/api': 'server' }`.
- Standalone frontend: `{ '.': 'web' }`.
- Omit roots you do not have.
- Duplicate, overlapping and outside-project roots throw.
- Shared baseline rules (formatting, imports, type safety) apply everywhere.

## Folder layout

Each folder is `flat` or `domain`. Defaults: web has `services: 'domain'` and `hooks: 'flat'`; server/runner have `services: 'domain'`.

```ts
architecture: {
  'apps/dashboard': { role: 'web', layout: { services: 'flat', hooks: 'domain', features: 'domain' } },
  'apps/api': { role: 'server', layout: { services: 'domain' } },
}
```

```
services/                     flat                    domain
  chat.client.ts       ✅                      ❌ (loose file)
  chat/chat.client.ts  ❌ (nested)             ✅
  chat/x/y.client.ts   ❌                      ❌ (one level only)
```

- Keys are literal paths inside the source folder (inside the root for packages/scripts).
- No globs, escapes, empty segments or overlapping folders.
- `domain` files start with their folder name (`chat/chat-action.send.ts`). Hooks keep `use-`, components keep their naming.
- Layout never turns off other rules.

## `sourceDir`

Web, server and runner code lives in `src` by default. Change it per root; `.` means the root itself.

```ts
architecture: {
  'apps/web': { role: 'web', framework: 'next', sourceDir: '.' }, // apps/web/app, apps/web/components
  'apps/api': { role: 'server', sourceDir: 'lib' },
}
```

- Every scope follows it: services, types, hooks, components, routes, layout, RPC owner, stylesheet.
- Literal path only. No globs or `..`. Not allowed on packages/scripts.
- With `.`, root config files such as `next.config.ts` are in app scope. Add them to `ignorePatterns` or `ruleExclusions` if a rule does not fit.

## Stylesheet

| Web root | Default Tailwind entry |
| --- | --- |
| TanStack Start | `<source>/application/styles.css` |
| Next | `<source>/app/globals.css` |

Override with `tailwind.cssEntryPointsByRoot` (per root) or `tailwind.cssEntryPoint` (all roots). Paths are relative to `root`. shadcn reads each app's own `components.json`.

## RPC client owner

One file per web root may create the RPC client:

| `services` layout | Owner |
| --- | --- |
| `flat` | `services/rpc.client.ts` |
| `domain` | `services/rpc/rpc.client.ts` |

Override with `orpc.clientOwnerFile`.
