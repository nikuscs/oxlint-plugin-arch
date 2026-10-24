# Options

All preset settings. Callbacks: [policies](policies.md). Per-file exceptions: [exceptions](exceptions.md). Back to the [preset overview](README.md).

```ts
export default preset({
  root: import.meta.dirname,
  severity: 'warn',
  ruleSeverities: { 'eslint-js/max-len': 'error' },
  formatting: { semi: 'never', quotes: 'double' },
  limits: { maxFileLines: 400, maxTypeFileLines: 1000, maxFunctionComplexity: 32 },
  imports: { backendEntryPoints: ['@app/server/client'], aliases: { '@backend': 'apps/server/src' } },
  orpc: { publicProcedureFiles: ['apps/server/src/rpc/public/**/*.ts'] },
  react: { compiler: true },
});
```

## General

| Option | Default | What it does |
| --- | --- | --- |
| `root` | `process.cwd()` | Project root. All paths are relative to it. Use `import.meta.dirname`. |
| `architecture` | `apps/web`, `apps/server`, `scripts`, `packages` | Folders and their roles. See [architecture](architecture.md). |
| `framework` | `'tanstack-start'` | Default framework for web roots. See [frameworks](frameworks.md). |
| `severity` | `'error'` | Level for every enabled rule: `'error'` or `'warn'`. |
| `ruleSeverities` | `{}` | Per-rule level (`'error'`, `'warn'`, `'off'`), applied after `severity` and policy callbacks. |
| `formatting.semi` | `'always'` | `'always'` or `'never'`. |
| `formatting.quotes` | `'single'` | `'single'` or `'double'`. `avoidEscape` stays on. |
| `limits.maxFileLines` | `400` | `max-lines` for app and test files. Blank lines and comments do not count. |
| `limits.maxTypeFileLines` | `1000` | `max-lines` for `*.types.ts` files in app roots, in place of `maxFileLines`. Same skip flags. |
| `limits.maxFunctionComplexity` | `32` | `complexity` limit. |
| `cliFiles` | `[]` | CLI files that may use `console` and `switch`. |
| `ignorePatterns` | `[]` | Extra whole-file ignores, added to build/dependency/generated defaults. |
| `ruleExclusions` | `{}` | Turn one rule off for listed files. See [exceptions](exceptions.md). |
| `policies` | all `true` | Turn a rule group off or change it. See [policies](policies.md). |

`ruleSeverities` notes:

- Rule options are kept; only the level changes.
- Rules the preset turns off stay off. `ruleExclusions` still wins for its files.
- A rule the preset never names (for example `no-debugger` from the `correctness` category) is set at the top level. For a rule outside every enabled category, that turns it on.

## Modules

| Option | Default | What it does |
| --- | --- | --- |
| `modules.customFileRoles` | `[]` | Extra file roles such as `prompts` (`route.prompts.ts`). Built-in roles cannot be redefined. See [conventions](conventions.md#custom-file-roles). |
| `modules.migrationFiles` | `[]` | Migration files that may export `up`/`down`. See [exceptions](exceptions.md#migrations). |
| `modules.colocatedTypeFiles` | `[]` | Type files allowed outside `types/`. See [exceptions](exceptions.md#type-files-next-to-their-code). |

## Imports and oRPC

| Option | Default | What it does |
| --- | --- | --- |
| `imports.backendEntryPoints` | `<backend package>/client` | Public backend imports for web code. Read from each backend `package.json`. |
| `imports.aliases` | `{}` | Import prefix → folder (relative to `root`). Boundary checks resolve them like relative paths. No wildcards. |
| `imports.internalSortPatterns` | `^@/`, `^#`, `^~icons/`, backend packages | Which imports sort as internal. Sorting only. |
| `orpc.publicProcedureFiles` | `[]` | Public oRPC endpoints. They must declare an output schema. |
| `orpc.outputSchemaComposers` | `[]` | Functions that build output schemas, such as `paginatedOutput`. |
| `orpc.clientOwnerFile` | per web root: `services/rpc.client.ts` (flat) or `services/rpc/rpc.client.ts` (domain) | The one file that may create the RPC client. |
| `sql.likeSanitizers` | `['escapeLikeWildcards']` | Functions that make `LIKE` values safe. |
| `forms.schemaResolver` | `'standardSchemaResolver'` | Resolver that `useForm` must receive. |

```ts
imports: { aliases: { '@backend': 'apps/server/src' } }
// '@backend/services/chat.service' is checked like '../../apps/server/src/services/chat.service'
```

## React, Tailwind and shadcn

| Option | Default | What it does |
| --- | --- | --- |
| `react.compiler` | `true` | Bans manual memoization; the 4 `react-perf` JSX prop rules are off. `false` allows memoization and turns those rules on. |
| `react.componentProps` | `true` | `false` turns off only `arch/component-props`. |
| `tailwind` | on | `false` turns Tailwind checks off. |
| `tailwind.cssEntryPoint` | per root, see [architecture](architecture.md#stylesheet) | One stylesheet for every web root. |
| `tailwind.cssEntryPointsByRoot` | `{}` | Stylesheet per architecture root: `{ 'apps/store': 'themes/store.css' }`. |
| `tailwind.rootFontSize` | `16` | Root font size for class canonicalization. |
| `shadcn` | on | `false` turns shadcn checks off; Tailwind checks stay. |
| `shadcn.uiImportPath` | `'@/components/ui'` | Where shadcn components are imported from. |
| `shadcn.componentImportSources` | `['^@/components/']` | Import sources treated as components. |

Class rules: [Tailwind and shadcn](styling.md).

## Framework runtime

| Option | Default | What it does |
| --- | --- | --- |
| `tanstackStart.additionalServerOnlyImports` / `next.additionalServerOnlyImports` | `[]` | Extra server-only module prefixes. |
| `tanstackStart.additionalClientOnlyImports` / `next.additionalClientOnlyImports` | `[]` | Extra client-only module prefixes. |
| `tanstackStart.computedImportAllowedFiles` / `next.computedImportAllowedFiles` | `[]` | Files allowed to use computed `import()`. Review their targets. |

Details: [`modules/tanstack-runtime`](../rules/modules/tanstack-runtime.md), [`modules/next-runtime`](../rules/modules/next-runtime.md).

## Tests

See [tests](tests.md) for `tests.profile`, `tests.additionalTestFunctions`, `tests.additionalAssertionFunctions` and `tests.mocking`.
