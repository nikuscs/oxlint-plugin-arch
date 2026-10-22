# `arch/filename-match`

Requires the current filename to match at least one configured regular expression.

## Why

Use one filename convention for files with the same role. The rule reports the message that you configure.

## Examples

❌ Incorrect

```ts
// apps/web/tests/e2e/tests/billing.spec.ts
export {}
```

✅ Correct

```ts
// apps/web/tests/e2e/tests/billing.auth.spec.ts
export {}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `pattern` | `string \| string[]` | Required | Regular expressions tested against the basename. Any pattern may match. |
| `message` | `string` | Required | Diagnostic text for a filename that does not match. |
| `flags` | `string` | None | Regular expression flags. |

```ts
// oxlint.config.ts
rules: {
  'arch/filename-match': ['error', {
    pattern: '\\.(auth|public)\\.spec\\.ts$',
    message: 'E2E specs must include their environment suffix.',
  }],
}
```

## Preset

Preset: `naming` policy, on type files, hooks, and action/query files in configured app roots.

## Related

- [`arch/folder-prefix`](./folder-prefix.md)
- [`arch/filename-export-name`](./filename-export-name.md)
