# arch/react-query-props

Reports a query hook whose options are not an object literal, or whose data function is neither a prop nor a function that calls a prop, so a shared component gets its data from the app.

```ts
// ❌
useQuery(rpc.app.orders.list.queryOptions())

// ❌
export function OrderCancel() {
  const mutation = useMutation({ mutationFn: (input) => rpc.app.orders.cancel.call(input) })
}

// ✅
export function OrderCancel({ cancel }: OrderCancelProps) {
  const mutation = useMutation({ mutationFn: cancel })
}
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `hooks` | `string[]` | `['useQuery', 'useMutation', 'useInfiniteQuery', 'useSuspenseQuery']` | Hook calls to check; replaces the default list |
| `functions` | `string[]` | `['queryFn', 'mutationFn']` | Option keys that hold the data function; replaces the default list |

A prop is a name the enclosing function takes from its first parameter: destructured there, destructured from it in the body, or read as its member. A data function passes when it is a prop or a function that calls one. Options that are not an object literal, or hold a spread, are reported; a hook call outside a function is not.

```ts
'arch/react-query-props': 'error'
'arch/react-query-props': ['error', { hooks: ['useData'], functions: ['fetcher'] }]
```
