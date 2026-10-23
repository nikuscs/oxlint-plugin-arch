# `dillon-anti-slop/no-module-mocking`

Ban Vitest and Jest module mocking, and optionally other test-double APIs, so tests replace dependencies through injection.

## Why

`vi.mock` swaps a module behind the code's back, so the test no longer proves the real wiring. Passing a fake driver or service through the code's dependencies keeps the seam visible and typed. With options the rule also bans stubs such as `vi.spyOn` or `vi.stubGlobal`.

`vi` is matched as a global, as an import from `vitest` (also renamed, `import { vi as v }`), and `jest` as a global or an import from `@jest/globals`. Computed string access such as `vi['mock']` counts, matched on the whole name, so `vi['mock.cached']` is not `vi.mock`. A local variable named `vi` does not. Calls through destructured bindings such as `const { spyOn } = vi` count only with `checkDestructured`.

## Examples

❌ Incorrect

```ts
vi.mock('./mailer')
```

```ts
import { vi as mocks } from 'vitest'
mocks.mock('./mailer')
```

```ts
// deny: ['vi.spyOn']
vi.spyOn(mailer, 'send')
```

```ts
// deny: ['*.mock', '*.spyOn'], checkDestructured: true
const { mock, spyOn: spy } = vi
mock('./mailer')
spy(mailer, 'send')
```

✅ Correct

```ts
const send = vi.fn()
vi.spyOn(mailer, 'send') // allowed with no options
```

```ts
// deny: ['vi.*'], allow: ['*.fn']
const send = vi.fn()
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `deny` | `Array<string \| { api: string; message?: string }>` | `['*.mock', '*.doMock', '*.unstable_mockModule']` | Banned APIs. Setting it replaces the default list. |
| `allow` | `string[]` | `[]` | APIs exempt from `deny`. |
| `checkDestructured` | `boolean` | `false` | Also report calls through `const` bindings destructured from `vi` or `jest`, renamed ones included. `let` and `var` bindings are skipped because they can be reassigned. |

API patterns are `<vi|jest|*>.<method|*>`, such as `vi.spyOn`, `*.stubGlobal` or `vi.*`. A bare `*` matches every API. Other patterns, such as `sinon.stub` or `vi.spy*`, throw when the rule loads. An entry `message` replaces the default message for that API. When several `deny` entries match a call, the first one sets the message.

```ts
// oxlint.config.ts
rules: {
  'dillon-anti-slop/no-module-mocking': ['error', {
    deny: ['*.mock', '*.doMock', '*.unstable_mockModule', { api: '*.spyOn', message: 'Inject a fake driver.' }],
    allow: ['*.fn'],
    checkDestructured: true,
  }],
}
```

With no options the rule behaves as before options existed.

## Autofix

None.

## Preset

Preset: `tests` policy, on `**/{test,tests,e2e}/**/*.{ts,tsx,mts,cts}` and `*.{test,spec}.{ts,tsx,mts,cts}` in every root. Configure it through [`tests.mocking`](../../preset/tests.md#mocking).

## Related

- [`modules/test-assertions`](../modules/test-assertions.md)
- [`modules/test-modifiers`](../modules/test-modifiers.md)
