# `arch/no-literal-in`

Rejects literal keys used with `in`. Use `Object.hasOwn()` or a discriminated union instead.

## Why

`'key' in value` also matches inherited properties. Own-property checks and unions are explicit.

## Examples

❌ Incorrect

```ts
'kind' in value
'status' in value
`ready` in value
```

✅ Correct

```ts
Object.hasOwn(value, 'kind')
value.kind === 'record'
key in value
0 in value
```

Static template literals with no expressions are treated as string keys. Dynamic keys and numeric literals pass.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allow` | `string[]` | `[]` | Literal keys that may still use `in`, such as `'serviceWorker'`. |

```ts
// oxlint.config.ts
rules: {
  'arch/no-literal-in': ['error', { allow: ['serviceWorker'] }],
}
```

## Preset

Preset: `typeSafety` policy, on app and test files.

## Related

- [`arch/no-promise-all-mutation`](./no-promise-all-mutation.md)
