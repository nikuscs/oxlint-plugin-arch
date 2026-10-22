# Policies

Each policy is a group of overrides. Turn it off or change it. Back to the [preset overview](README.md).

| Value | Effect |
| --- | --- |
| `true` (default) | Preset configuration. |
| `false` | Policy removed. |
| `(current) => next` | Receives fresh override objects; return the list to use. |

```ts
policies: {
  typePlacement: (current) => current.map((scope) => ({
    ...scope,
    excludeFiles: [...(scope.excludeFiles ?? []), '**/portable/**'],
  })),
  shadcn: false,
}
```

- Callbacks run in policy order, before `severity` and `ruleSeverities`.
- Rules the preset turns off stay off.
- Append to the returned array to add an override.
- Callbacks never change another preset call.
- `typePlacement: false` drops type location rules; `typeSafety` still bans `any`/`unknown`.

Policies: `typePlacement`, `typeSafety`, `serviceStructure`, `fileLayout`, `naming`, `comments`, `formatting`, `statementLayout`, `imports`, `react`, `effects`, `memoization`, `routes`, `forms`, `schemas`, `boundaries`, `tests`, `trivialFunctions`, `mutableState`, `backend`, `rpcClientOwnership`, `tailwind`, `shadcn`.

Each rule page lists the policy that enables it.

## Native overrides

Later overrides win, so you can also extend the preset:

```ts
import { defineConfig } from 'oxlint';
import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default defineConfig({
  options: { typeAware: true }, // Oxlint reads typeAware from the root config only
  extends: [preset({ root: import.meta.dirname })],
  overrides: [{ files: ['scripts/**/*.ts'], rules: { 'unicorn/filename-case': 'off' } }],
});
```

`export default preset(...)` already sets `typeAware`.

## Inline disables

Allowed per rule, with a reason after `--`:

```ts
// oxlint-disable-next-line arch/no-comments -- generated banner
```

The preset does not make warnings fail and does not define a CI workflow.
