# 🗂️ Folders

`preset()` takes a map of folders. Each folder says what it holds; groups add the rules. Most projects need only the folders detection gets wrong:

```ts
// oxlint.config.ts
import { preset } from 'oxlint-plugin-arch/preset'

export default preset({ root: import.meta.dirname, folders: { '.': { style: { quotes: 'double' } } } })
```

Everything spelled out, with detection off:

```ts
// oxlint.config.ts
import { preset, recipes } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  detect: false,
  folders: {
    '.': { layout: { suffixes: ['prompts'] }, tests: { assertions: ['arch.**.to*'] } },
    'apps/web': recipes.tanstack,
    'apps/server': { ...recipes.backend, orpc: { public: ['apps/server/src/rpc/api/**'] } },
    'apps/server/src/services/database/migrations': { layout: false },
    'packages/*': recipes.library,
    'packages/ui': { ...recipes.ui, react: { a11y: false } },
    scripts: recipes.cli,
    'tools/legacy': false,
  },
})
```

## 🔎 Detection

Unless `detect: false`, the preset reads the root `package.json` `workspaces` (or the root package when there are none) and picks a recipe for each workspace folder from its dependencies. The first match wins:

| Dependencies | Recipe |
| --- | --- |
| `@tanstack/react-start` | `tanstack` |
| `next` or `vinext` | `next` |
| `expo` | `expo` |
| `electrobun`, `electron` or `@tauri-apps/*` | `desktop` |
| `@orpc/server`, `hono`, `kysely`, `drizzle-orm`, `express`, `fastify` or `elysia`, in an app or next to a `services/` folder | `backend` |
| `react` with a `components/` folder | `react` (app) or `ui` (package) |
| anything else | `library` |

A `scripts/` folder gets `cli`, and `'.'` bans `framer-motion`. Folders without a `package.json` (Rust, Go) are not units.

Detection also adds conventions:

| Where | Adds |
| --- | --- |
| Backend `services/` | Bans importing the registry, another service's `actions`/`queries`, and the backend's own package entries |
| Backend `core/`, `rpc/`, `routes/`, `cli/` | Bans service operations or the registry; `cli/` also bans `.service` imports and names files `cli…` |
| Backend `tests/kits/` or `test/kits/` | Kit file names; the tests import kit files, not the kit index |
| Any `migrations/` in a backend | Numbered file names (`001_init.ts`, `20240101120000-init.ts`), unique numbers, no layout check |
| Web app | Bans the backend's `package.json` `imports` aliases, and server `.service` files when there is a backend; `components/` and `routes/` import only the backend client entry |
| Package | Bans `../../apps/**` and the backend's import aliases (not its own) |
| Backend registry | `services/service.ts`, `core/core.services.ts` or `service.ts`, see [`backend`](groups/backend.md) |
| Stylesheet | See [`tailwind`](groups/tailwind.md) |
| Web `services/` | `layout.services: 'flat'` when it holds more files than folders |

Your folders merge over the detected ones: a key you set wins, and objects merge (`layout: { hooks: false }` keeps the detected `services: 'flat'`). A detected key inside a folder you set as a `*` glob or a parent is left out.

## 📐 Rules

| | |
| --- | --- |
| `'.'` | The whole project. Every other folder inherits from its parent and changes only what it sets. |
| Deepest wins | A file follows the deepest matching folder. An exact key beats a `*` glob at the same depth (`packages/ui` over `packages/*`, also when `packages/*` is `false`). |
| Folder value | `true` inherits, `false` skips the folder, an object inherits and changes. |
| Group value | `true` on with the inherited settings (defaults when nothing is inherited), `false` off, `'warn'` the same as warnings, an object = inherited settings plus changes. `console` and `kit` take only `true` or `false`. |
| Paths | Paths inside settings are relative to `root`; `source` is relative to its folder. |
| Units | Top-level keys are units (app, backend, library, CLI). When `'.'` is itself an app, backend or CLI, it stays a unit, and only top-level keys that set `tanstack`, `next`, `expo`, `backend` or `console` become units. A key inside another key only refines it. |
| Errors | Unknown keys, unknown options, missing folders and keys inside a `false` folder throw. |

## 🧩 Folder keys

| Key | | |
| --- | --- | --- |
| `severity` | `'error' \| 'warn'` | Level for every rule in the folder, inherited by its subfolders; the `correctness` category keeps the `'.'` level |
| `source` | `string` | Source folder inside this folder: default `src`, or `.` for CLIs and for a root without `src` |
| `rules` | `Record<rule, level \| [level, options]>` | Last-word overrides for single rules; options replace the rule's options in the folder |
| any [group](#-groups) | `true \| false \| 'warn' \| options` | |

```ts
'apps/web/src': {
  rules: {
    'react/jsx-no-useless-fragment': 'off',
    'eslint-js/no-restricted-syntax': ['error', { selector: "JSXAttribute[name.name='data-testid']", message: 'Select by role or label.' }],
  },
},
```

## 📚 Groups

On by default: [`layout`](groups/layout.md), [`limits`](groups/limits.md), [`style`](groups/style.md), [`basics`](groups/basics.md), [`naming`](groups/naming.md), [`comments`](groups/comments.md), [`types`](groups/types.md), [`imports`](groups/imports.md), [`tests`](groups/tests.md), [`deny`](groups/deny.md), [`externals`](groups/externals.md).

Opt-in: [`react`](groups/react.md), [`tanstack`](groups/tanstack.md), [`next`](groups/next.md), [`expo`](groups/expo.md), [`tailwind`](groups/tailwind.md), [`shadcn`](groups/shadcn.md), [`kit`](groups/kit.md), [`backend`](groups/backend.md), [`orpc`](groups/orpc.md), [`schemas`](groups/schemas.md), [`forms`](groups/forms.md), [`sql`](groups/sql.md), [`console`](groups/console.md).

A folder with `tanstack`, `next` or `expo` is an app; with `backend` a backend; with `console` a CLI; anything else a library.

## 🍱 Recipes and templates

Recipes are plain objects that only toggle groups, so spreading them is safe.

| Recipe | Turns on |
| --- | --- |
| `tanstack` | `react`, `tanstack`, `tailwind`, `shadcn`, `schemas`, `forms` |
| `next` | `react`, `next`, `tailwind`, `shadcn`, `schemas`, `forms` |
| `expo` | `react`, `expo`, `schemas`, `forms` |
| `backend` | `backend`, `schemas`, `sql` |
| `react` | `react`, `tailwind`, `schemas` |
| `library` | `schemas` |
| `ui` | `react`, `kit`, `tailwind` (`kit` is the same recipe) |
| `desktop` | `console` |
| `cli` | `console` |

```ts
import { preset, recipes, templates } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    ...templates.monorepo,
    'apps/web': { ...recipes.tanstack, layout: { services: 'flat' } },
  },
})
```

`templates.monorepo` = `apps/web` tanstack, `apps/server` backend, `packages/*` library, `scripts` cli.

> [!NOTE]
> Type-aware rules need `oxlint-tsgolint`.
