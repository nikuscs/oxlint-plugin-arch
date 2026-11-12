# arch/types-service

Reports every interface and every alias except `XService = ReturnType<typeof makeXService>`. `suffix` and `factory` change `Service` and `make`. The factory name is `factory` plus the alias name (`UserService` ← `makeUserService`); any other wrapper, like `Awaited<typeof …>`, fails. Exported or not, both report.

```ts
// ❌
interface UserService {
  find(id: string): User
}

// ✅
export type UserService = ReturnType<typeof makeUserService>
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `suffix` | `string` | `'Service'` | Name ending of the allowed alias |
| `factory` | `string` | `'make'` | Prefix of the factory the alias derives from |

```ts
'arch/types-service': 'error'
'arch/types-service': ['error', { factory: 'create' }]
```
