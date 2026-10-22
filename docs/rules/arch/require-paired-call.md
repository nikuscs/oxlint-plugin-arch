# `arch/require-paired-call`

Requires a second configured call whenever the trigger call appears anywhere in the same file.

## Why

A form without a schema resolver, or a tracker without a flush, is incomplete. The pair is file-wide, not nested in the same expression.

## Examples

❌ Incorrect

```ts
useForm({ defaultValues: {} })
```

```ts
useForm()
trackEvent()
```

✅ Correct

```ts
useForm({ resolver: standardSchemaResolver(schema) })
```

```ts
const resolver = standardSchemaResolver(schema)
useForm({ resolver })
```

Imported aliases count: `useForm as useF` still requires the configured partner. Two trigger calls in one file still need only one partner call. Extra pairs can be listed together.

## Options

Set `when` and `require`, or `pairs`, or both (they merge).

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `when` | `string` | none | Trigger call name. |
| `require` | `string` | none | Call that must appear in the same file. |
| `pairs` | `{ when: string; require: string }[]` | none | Extra trigger/require pairs. |

```ts
// oxlint.config.ts
rules: {
  'arch/require-paired-call': [
    'error',
    {
      when: 'useForm',
      require: 'standardSchemaResolver',
    },
  ],
}
```

## Preset

Preset: `forms` policy, on web files except UI, pairing `useForm` with `options.forms.schemaResolver` (default `standardSchemaResolver`).

## Related

- [`arch/no-local-schema-construction`](./no-local-schema-construction.md)
