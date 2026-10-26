# arch/backend-registry

Every domain folder under `services` has a `<folder>.service.ts`, and the registry file names each one as a camelCase key of a top-level object or of the object a top-level function returns (`object` pins one name).

```ts
// services/billing/billing.service.ts exists

// ❌ core/core.services.ts
export const services = { order: makeOrderService }

// ✅
export const services = { order: makeOrderService, billing: makeBillingService }
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `registry` | `string` | required | Absolute path of the registry file |
| `services` | `string` | required | Absolute path of the services folder |
| `skip` | `string[]` | `[]` | Folders that are not services |
| `object` | `string` | none | Name of the top-level variable or function that holds the registry; without it, every top-level object and factory result counts |

Both reports land on the registry file, which lists every domain folder. Identifier and string keys count; other objects in the file do not. A missing `services` folder means no domains.

```ts
'arch/backend-registry': ['error', { registry: resolve('src/core/core.services.ts'), services: resolve('src/services'), skip: ['database'] }]
```
