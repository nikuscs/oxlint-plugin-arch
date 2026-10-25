# arch/types-service

Reports every interface and every alias except `XService = ReturnType<typeof makeXService>`.

```ts
// ❌
interface UserService {
  find(id: string): User
}

// ✅
export type UserService = ReturnType<typeof makeUserService>
```

```ts
'arch/types-service': 'error'
```
