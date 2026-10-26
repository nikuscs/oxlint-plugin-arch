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

Unless `detect: false`, the preset reads the workspaces from the root `package.json` (`workspaces`, as an array or `{ packages }`) and `pnpm-workspace.yaml`, with `*`, `**`, `{a,b}` and `!exclude` patterns, and picks a recipe for each workspace folder from its dependencies, dev dependencies and peer dependencies. A single package gets a recipe for `'.'`; a root app with `src/` keeps its recipe next to its workspaces. The first match wins:

| Dependencies | Recipe |
| --- | --- |
| `next` or `vinext` | `next` |
| `@tanstack/react-start` | `tanstack` |
| `expo` | `expo` |
| `electrobun`, `electron` or `@tauri-apps/*` | `desktop` |
| `@orpc/server`, `hono`, `kysely`, `drizzle-orm`, `express`, `fastify` or `elysia`, in an app or next to a `services/` folder; or any `services/<domain>/<domain>.service.ts` | `backend` |
| `react` with a `components/` folder | `react` (app) or `ui` (package) |
| anything else | `library` |

A `scripts/` folder gets `cli`, and `'.'` bans `framer-motion`. Folders without a `package.json` (Rust, Go) are not units.

Detection also adds conventions:

| Where | Adds |
| --- | --- |
| Backend `services/` | Bans importing the registry, another domain's `actions`/`queries` (a domain may import its own), and the backend's own package entries |
| Backend `core/`, `rpc/`, `routes/`, `cli/` | Bans service operations or the registry; `cli/` also bans `.service` imports and names files `cli…` |
| Backend `tests/kits/` or `test/kits/` | Kit file names; the tests import kit files, not the kit index |
| Any `migrations/` up to 8 folders deep in a backend | Numbered file names (`001_init.ts`, `20240101120000-init.ts`), unique numbers, no layout check |
| Web app | Bans the backend's `package.json` `imports` aliases that the app does not define itself, and server `.service` files when there is a backend; `components/` and `routes/` import only the backend client entry |
| Package | Bans `../../apps/**` and the backend's import aliases (not its own) |
| Backend registry | `backend.registry` when set, else `services/service.ts`, `core/core.services.ts` or `service.ts`; see [`backend`](groups/backend.md). The registry file is exempt from the domain layout |
| Stylesheet | See [`tailwind`](groups/tailwind.md) |
| Web `services/` | `layout.services: 'flat'` when it holds more files than folders |

Your folders merge over the detected ones: a key you set wins, and objects merge (`layout: { hooks: false }` keeps the detected `services: 'flat'`). A detected key inside a folder you set as a `*` glob or a parent is left out, and a `*` key still gets the conventions of each folder it matches. Conventions inside a `false` folder are dropped, and a group you set to `false` on a parent stays off. Detection follows symlinked folders and skips broken links.

## 📐 Rules

| | |
| --- | --- |
| `'.'` | The whole project. Every other folder inherits from its parent and changes only what it sets. |
| Deepest wins | A file follows the deepest matching folder. An exact key beats a `*` glob at the same depth (`packages/ui` over `packages/*`, also when `packages/*` is `false`). |
| Folder value | `true` inherits, `false` skips the folder, an object inherits and changes. |
| Group value | `true` on with the inherited settings (defaults when nothing is inherited), `false` off, `'warn'` the same as warnings, an object = inherited settings plus changes (an options object inside merges too; arrays replace). `console` and `kit` take only `true` or `false`. |
| Paths | Paths inside settings are relative to `root`; `source` is relative to its folder. Keys are literal folder paths (dots allowed, `.agents` too); `apps/web/` and `./apps/web` mean `apps/web`. |
| Units | Top-level keys are units (app, backend, library, CLI). When `'.'` is itself an app, backend or CLI, it stays a unit, and only top-level keys that set `tanstack`, `next`, `expo`, `backend` or `console`, or have their own `package.json`, become units. A folder with its own `package.json` is a unit with its own kind anywhere; another key inside a key only refines it. Output folders (`dist`, `build`, `coverage`, `.output`) are ignored at the root and at each unit's root. |
| Errors | Unknown keys, unknown options, missing folders and keys inside a `false` folder throw. |

## 🧩 Folder keys

| Key | | |
| --- | --- | --- |
| `severity` | `'error' \| 'warn'` | Level for every rule in the folder, inherited by its subfolders; the `correctness` category keeps the `'.'` level |
| `source` | `string` | Source folder inside this folder: default `src`, or the folder itself for CLIs and when it has no `src` |
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
