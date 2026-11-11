# 📝 forms

`useForm` needs a schema resolver. Opt-in.

```ts
folders: {
  'apps/web': { forms: true },
}
```

Takes `true`, `false` or `'warn'`. `useForm` is paired with `standardSchemaResolver`; another resolver is a `rules` line:

```ts
'apps/web': { rules: { 'arch/code-paired-call': ['error', { when: 'useForm', require: 'zodResolver' }] } },
```

Rules: [`arch/code-paired-call`](../rules/code-paired-call.md).
