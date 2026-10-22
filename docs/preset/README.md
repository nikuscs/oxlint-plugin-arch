# React modules preset

A ready policy for React apps with a typed backend. It turns on `arch/*`, `modules/*`, `dillon-anti-slop/*`, Oxlint, React, Tailwind and shadcn rules for the folders you declare. Importing the plain plugin does not enable it.

## Install

```sh
bun add -d oxlint oxlint-tsgolint oxlint-plugin-arch
```

In your root `oxlint.config.ts`:

```ts
import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({ root: import.meta.dirname });
```

- Returns a plain `OxlintConfig`.
- Ships and loads its own plugins (React, effects, Tailwind, shadcn, imports, formatting).
- Type-aware: install `oxlint-tsgolint` and have a tsconfig for linted files.
- Needs Oxlint 1.85+.
- Run the config from its real path; `root` makes resolution independent of the working directory.

## Pick a preset

| Import | Default web framework |
| --- | --- |
| `oxlint-plugin-arch/presets/tanstack-start-react-modules-preset` | TanStack Start |
| `oxlint-plugin-arch/presets/next-react-modules-preset` | Next.js App Router |
| `reactModulesPreset` from `oxlint-plugin-arch/presets` | Set per web root with `framework` |

## Topics

| Page | Read it when |
| --- | --- |
| [Architecture](architecture.md) | You declare apps, roles, folder layouts and `sourceDir`. |
| [Frameworks](frameworks.md) | You use Next.js, TanStack Start, or both. |
| [Options](options.md) | You change severity, formatting, limits, imports or React settings. |
| [Policies](policies.md) | You change or extend one group of rules. |
| [Exceptions](exceptions.md) | One file does not fit a rule. |
| [Application conventions](conventions.md) | You want to know the structure the preset enforces. |
| [Tailwind and shadcn](styling.md) | You hit a class-name error. |
| [Tests](tests.md) | You set up test profiles and assertion helpers. |

## How it is built

- Oxlint `correctness` rules are on through `categories.correctness`; policies add the opinionated rules on top.
- `modules/*` rules keep independent policies from overwriting each other. `dillon-anti-slop/*` rules are vendored from [anti-slop](https://github.com/dmmulroy/anti-slop). The preset loads both; the plain `arch` plugin does not.
- Every enabled rule has [paired CLI fixtures](../../tests/fixtures/tanstack-start-react-modules/README.md). A coverage guard flags new rules without fixtures.
