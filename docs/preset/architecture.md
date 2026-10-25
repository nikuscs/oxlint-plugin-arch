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
| `packages` | `<root>/src`, or `<root>/*/src` | App rules with backend-style services and web-style React code; cannot import app internals. See [packages](#packages). |

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

- Keys are literal paths inside the source folder (inside the root for scripts). Packages also default to `services: 'domain'`.
- No globs, escapes, empty segments or overlapping folders.
- `domain` files start with their folder name (`chat/chat-action.send.ts`). Hooks keep `use-`, components keep their naming.
- Layout never turns off other rules.

## Packages

A packages root with its own `package.json` is one package (`'packages/ui': 'packages'`). Without one, each child folder is a package (`packages: 'packages'` covers `packages/*/src`). Only `src` gets the app rules; files elsewhere in a package keep the shared baseline and import boundaries.

| Package code | Rules, same as |
| --- | --- |
| Every file | Comments, type safety, type placement, schemas, mutable state, trivial functions, `max-lines`, `complexity`: all app roots. |
| `services/`, `types/`, file roles (`*.utils.ts`, `*.service.ts`, …) | Server roots, including the `services: 'domain'` layout. |
| `*.tsx`, `components/`, `hooks/` | Web roots: React, effects, memoization, forms, component and hook naming. |
| `types/**` | May construct schemas. `*.types.ts` files belong there too. |

Never on packages: `modules/backend-switch`, `modules/rpc-database`, `arch/require-orpc-output`, `modules/tanstack-runtime`, `arch/no-restricted-token`, `arch/no-runtime-in-types`, `modules/dynamic-classes`, routes, Tailwind and shadcn usage rules. A UI kit package named in [`shadcn.ui`](styling.md#ui-kit) keeps the kit exceptions and gets the Tailwind checks.

Hooks may carry a React Native platform suffix: `use-chat-draft.web.ts`, `.native.ts`, `.ios.ts`, `.android.ts`. This applies to web roots too.

Opt one package out of one rule with `ruleExclusions: { 'arch/no-comments': ['packages/legacy/**'] }`.

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
