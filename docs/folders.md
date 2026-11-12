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
    '.': { layout: { files: ['*.prompts.ts'] }, tests: { assertions: ['arch.**.to*'] } },
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

## 🔑 Keys

| | |
| --- | --- |
| `'.'` | The whole project. Every other folder inherits from its parent and changes only what it sets. |
| Deepest wins | A file follows the deepest matching folder. An exact key beats a `*` glob at the same depth (`packages/ui` over `packages/*`, also when `packages/*` is `false`). |
| Key forms | A folder (`apps/web`, or `packages/*` for each folder in it), a list of folders (`src/lib/{dgsi,dr}`, each as if written alone; a folder also written alone merges with it in config order, the later over the earlier), one file (`src/app/default.tsx`) or a file pattern (`*`, `**`, `{a,b}`, ending in a file name such as `*.actions.ts`). |
| File keys | A file key changes the settings of the files it matches on top of their folder's. When two file keys match one file and set the same group, the later key's setting replaces the earlier one's on the files both match; the rest of the earlier key still applies. A group set on a file key applies to exactly the files that match both the key and the group's own files. When the group's files are narrower than every source file, the preset lists the matching files on disk when the config loads: a matching file created later keeps its folder's settings for that group until the config loads again. Its `rules` come after every folder's `rules`. |
| Folder value | `true` inherits, `false` skips the folder (or the files of a file key), an object inherits and changes. |
| Group value | `true` on with the inherited settings (defaults when nothing is inherited), `false` off, `'warn'` the same as warnings, an object = inherited settings plus changes (an options object inside merges too; arrays replace, except `layout.files`, which adds to the parent's list and drops a `!name` entry). `console` and `kit` take only `true` or `false`. |
| Paths | Paths inside settings are relative to `root`; `source` is relative to its folder. Folder keys are literal paths (dots allowed, `.agents` too); `apps/web/` and `./apps/web` mean `apps/web`. File keys may also hold `@`, `$`, `[` and `]` (`src/routes/[...rest].tsx`). |
| Units | Top-level keys are units (app, backend, library, CLI). When `'.'` is itself an app, backend or CLI, it stays a unit, and only top-level keys that set `tanstack`, `next`, `expo`, `backend` or `console`, or have their own `package.json`, become units. A folder with its own `package.json` is a unit with its own kind anywhere; another key inside a key only refines it. Output folders (`dist`, `build`, `coverage`, `.output`) are ignored at the root and at each unit's root. |
| Errors | Unknown keys, unknown options, missing folders or files and keys inside a `false` folder throw. A file pattern that matches nothing does not. |

### 🧩 Folder keys

| Key | | |
| --- | --- | --- |
| `severity` | `'error' \| 'warn'` | Level for every rule in the folder, inherited by its subfolders; the `correctness` category keeps the `'.'` level |
| `source` | `string` | Source folder inside this folder: default `src`, or the folder itself for CLIs and when it has no `src` |
| `services` | `string` | Service folder inside `source`: default `services`, or `lib` for an app or backend that has no `services/`. Every service check (layout, naming, import boundaries, registry) follows it. Set on an app or package folder |
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

A file key takes every key above and every group, except those that say what a folder is: `source`, `services`, `tanstack`, `next`, `expo`, `backend`, `console`, `kit` and `layout.operations` throw with "set it on a folder".

```ts
'apps/server/src/domains/**/*.actions.ts': { limits: { lines: 1500 } },
'apps/server/src/domains/**/*.queries.ts': { deny: { calls: { updateTable: 'A query reads only.' } } },
'apps/server/tests/**/*.test.ts': { limits: { lines: 1000 } },
'src/app/default.tsx': { rules: { 'arch/code-trivial-functions': 'off' } },
'src/app/@dialog/**/{default,page}.tsx': { rules: { 'arch/code-trivial-functions': 'off' } },
'src/lib/{dgsi,dr}': pureCore,
'alchemy.*.ts': { rules: { 'import-extra/no-relative-packages': 'off' } },
'tools/legacy/**/*.gen.ts': false,
```

## 🏷️ Names

A folder's service files take the names in [`layout.files`](groups/layout.md): the built-in ones (`*.service.ts`, `*.utils.ts`, `*-action.*.ts` and the rest), plus the ones you add; `!name` removes one. A key lists only its changes to the parent's list. A `*.<word>.ts` name that is not built-in, like `*.prompts.ts`, is a file kind across the project; [`layout`](groups/layout.md) lists what that means. `layout: { strict: true }` (the `backend` recipe sets it) reports a domain file whose name is not in the list.

```ts
'.': { layout: { files: ['*.prompts.ts'] } },
'apps/server/src/domains': { layout: { files: ['*.gateway.ts', '!*.utils.ts'] } },
```

## 🔎 Detection

Unless `detect: false`, the preset reads the workspaces from the root `package.json` (`workspaces`, as an array or `{ packages }`) and `pnpm-workspace.yaml`, with `*`, `**`, `{a,b}` and `!exclude` patterns, and picks a recipe for each workspace folder from its dependencies, dev dependencies and peer dependencies. A single package gets a recipe for `'.'`; a root app with `src/` keeps its recipe next to its workspaces. The first match wins:

| Dependencies | Recipe |
| --- | --- |
| `next` or `vinext` | `next` |
| `@tanstack/react-start` | `tanstack` |
| `expo` | `expo` |
| `electrobun`, `electron` or `@tauri-apps/*` | `desktop` |
| `effect` and a React package | `react` (an app, or a package with `pages/` or `link.tsx`) or `ui` (another package), with `effect: { code: false }` and the Effect import bans |
| `effect` with a backend package or a `domains/` folder | `backend` with `effect` over it: a backend in Effect style, see [`effect`](groups/effect.md#what-an-effect-server-gets) |
| `effect` | `effect` |
| `@orpc/server`, `hono`, `kysely`, `drizzle-orm`, `express`, `fastify` or `elysia`, in an app or next to a `services/` folder; or any `services/<domain>/<domain>.service.ts` | `backend` |
| A React package | `react` (an app, or a package with `pages/` or `link.tsx`) or `ui` (another package) |
| anything else | `library` |

A React package depends on `react` and has `components/`, `pages/` or `link.tsx` (or `link.ts`) in its source folder. A Next, TanStack or Expo app that depends on `effect` also gets `effect: { code: false }` and the Effect import bans. A workspace without `effect` keeps the order backend, React package, library. A `scripts/` folder gets `cli`; a `.agents` folder gets `cli` with the default quotes and semicolons, whatever the root sets; and `'.'` bans `framer-motion`. Folders without a `package.json` (Rust, Go) are not units.

## 🎯 Forcing a recipe

A folder set to a recipe, as is or spread with more settings, replaces the recipe detection picked for it; `'.'` keeps its `framer-motion` ban. Any other value you write, such as `{ backend: { registry: false } }` or `{ console: true }`, merges over detection.

```ts
'apps/server': recipes.effect,
'packages/i18n': recipes.library,
'tools/legacy': false,
```

Your folders merge over the detected ones: a key you set wins, and objects merge (`layout: { hooks: false }` keeps the detected `services: 'flat'`). A detected key inside a folder you set as a `*` glob or a parent is left out, and a `*` key still gets the conventions of each folder it matches. Conventions inside a `false` folder are dropped, and a group you set to `false` on a parent stays off. Detection follows symlinked folders and skips broken links.

## 🧭 Conventions

Detection also adds conventions, as folder and file keys you can restate: lists add, objects merge, and `false` or `'off'` turns an entry off.

| Where | Adds |
| --- | --- |
| Backend `services/` | Bans importing the registry, another domain's `actions`/`queries` (a domain may import its own), and the backend's own package entries |
| Backend `core/`, `rpc/`, `routes/`, `cli/` | Bans service operations or the registry; `cli/` also bans `.service` imports and names files `cli…` |
| Backend `tests/kits/` or `test/kits/` | Kit file names; the tests import kit files, not the kit index |
| Any `migrations/` up to 8 folders deep in a backend, outside `tests/` and `test/` | Numbered file names (`001_init.ts`, `20240101120000-init.ts`, `2026-11-12-10-00-create-news.ts`), unique numbers (a dated prefix is read whole), no layout check |
| Backend registry | `backend.registry` when set, else `services/service.ts`, `core/core.services.ts` or `service.ts`; see [`backend`](groups/backend.md). The registry file is exempt from the domain layout |
| Web app | Bans the backend's `package.json` `imports` aliases that the app does not define itself, and server `.service` files when there is a backend; `components/` and `routes/` import only the backend client entry |
| Web app, or a React package with `pages/` or `link.tsx` | `layout.services: 'flat'` when its `services/` holds more files than folders |
| App or backend without `services/` | Its `lib/` is the service folder; with `services/`, `lib/` stays portable helpers |
| Package | Bans `../../apps/**` and the backend's import aliases (not its own) |
| Stylesheet | See [`tailwind`](groups/tailwind.md) |
| Effect server | The server's file names, operations, layers (local layers named `<Role>Layer`), one-line step comments, workflows and entry files; with `sql`, Kysely chains one call per line; see [`effect`](groups/effect.md#what-an-effect-server-gets) |
| Effect contract package | The contract's file names, export prefixes and constants-only files; see [`effect`](groups/effect.md#what-a-contract-package-gets) |
| Effect unit | Tagged errors only in `*.errors.ts`; see [`effect`](groups/effect.md#error-classes) |
| Frontend package (Effect) | Query hooks from props, no rpc client, the router only through `link.tsx`, `forms`; see [`effect`](groups/effect.md#what-a-frontend-package-gets) |
| Web app next to a contract package | The contract's root entry as types only; see [`effect`](groups/effect.md#what-the-web-app-gets) |
| UI kit (Effect) | No app package imports; see [`effect`](groups/effect.md#what-a-ui-kit-gets) |

## 📚 Groups

On by default: [`layout`](groups/layout.md), [`limits`](groups/limits.md), [`style`](groups/style.md), [`basics`](groups/basics.md), [`naming`](groups/naming.md), [`comments`](groups/comments.md), [`types`](groups/types.md), [`imports`](groups/imports.md), [`tests`](groups/tests.md), [`deny`](groups/deny.md), [`externals`](groups/externals.md).

Opt-in: [`react`](groups/react.md), [`tanstack`](groups/tanstack.md), [`next`](groups/next.md), [`expo`](groups/expo.md), [`tailwind`](groups/tailwind.md), [`shadcn`](groups/shadcn.md), [`kit`](groups/kit.md), [`backend`](groups/backend.md), [`orpc`](groups/orpc.md), [`schemas`](groups/schemas.md), [`forms`](groups/forms.md), [`sql`](groups/sql.md), [`effect`](groups/effect.md), [`console`](groups/console.md).

A folder with `tanstack`, `next` or `expo` is an app; with `backend` a backend; with `console` a CLI; anything else a library.

## 🍱 Recipes and templates

Recipes are plain objects that only toggle groups, so spreading them is safe.

| Recipe | Turns on |
| --- | --- |
| `tanstack` | `react`, `tanstack`, `tailwind`, `shadcn`, `schemas`, `forms` |
| `next` | `react`, `next`, `tailwind`, `shadcn`, `schemas`, `forms` |
| `expo` | `react`, `expo`, `schemas`, `forms` |
| `backend` | `backend`, `schemas`, `sql`, `orpc` |
| `react` | `react`, `tailwind`, `schemas` |
| `library` | `schemas` |
| `effect` | `schemas`, `effect`, and `deny.imports` for `effect`, `zod`, `ts-pattern`, `dayjs` |
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
