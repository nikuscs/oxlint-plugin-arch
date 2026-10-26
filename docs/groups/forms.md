# 📝 forms

`useForm` needs a schema resolver. Opt-in.

```ts
folders: {
  'apps/web': { forms: { resolver: 'zodResolver' } },
}
```

Takes `true`, `false`, `'warn'` or an object:

| Key | Type | Default | |
| --- | --- | --- | --- |
| `resolver` | `string` | `'standardSchemaResolver'` | Required resolver call |

Rules: [`arch/code-paired-call`](../rules/code-paired-call.md).
