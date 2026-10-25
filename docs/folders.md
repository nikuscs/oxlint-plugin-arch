# 🗂️ Folders

`preset()` takes a map of folders. Each folder says what it holds; groups add the rules.

```ts
// oxlint.config.ts
import { preset, recipes } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    '.': { layout: { suffixes: ['prompts'] }, tests: { assertions: ['arch.**.to*'] } },
    'apps/web': recipes.tanstack,
    'apps/server': { ...recipes.backend, orpc: { public: ['apps/server/src/rpc/api/**'] } },
    'apps/server/src/services/database/migrations': { layout: false },
    'packages/*': recipes.library,
    'packages/ui': { ...recipes.kit, react: { a11y: false } },
    scripts: recipes.cli,
    'tools/legacy': false,
  },
})
```

## 📐 Rules

| | |
| --- | --- |
| `'.'` | The whole project. Every other folder inherits from its parent and changes only what it sets. |
| Deepest wins | A file follows the deepest matching folder. An exact key beats a `*` glob at the same depth (`packages/ui` over `packages/*`). |
| Folder value | `true` inherits, `false` skips the folder, an object inherits and changes. |
| Group value | `true` defaults, `false` off, `'warn'` on as warnings, an object = defaults plus changes. |
| Paths | Every path, inside settings too, is relative to `root`. |
| Units | Top-level keys are units (app, backend, library, CLI). A key inside another key only refines it. |
| Errors | Unknown keys, unknown options and missing folders throw. |

## 🧩 Folder keys

| Key | | |
| --- | --- | --- |
| `severity` | `'error' \| 'warn'` | Level for every rule in the folder |
| `source` | `string` | Source folder, default `src` |
| `rules` | `Record<rule, 'error' \| 'warn' \| 'off'>` | Last-word overrides for single rules |
| any [group](#-groups) | `true \| false \| 'warn' \| options` | |

## 📚 Groups

On by default: [`layout`](groups/layout.md), [`limits`](groups/limits.md), [`style`](groups/style.md), [`basics`](groups/basics.md), [`naming`](groups/naming.md), [`comments`](groups/comments.md), [`types`](groups/types.md), [`imports`](groups/imports.md), [`tests`](groups/tests.md).

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
| `library` | `schemas` |
| `kit` | `react`, `kit`, `tailwind` |
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
