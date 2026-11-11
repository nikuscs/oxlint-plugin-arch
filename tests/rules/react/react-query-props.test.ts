import { describe, it } from 'vitest'
import { reactQueryProps } from '../../../src/rules/react/react-query-props.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/react-query-props', () => {
  it.each([
    { name: 'a destructured prop as the mutation function', code: 'function Cancel({ cancel }) { const mutation = useMutation({ mutationFn: cancel }) }' },
    {
      name: 'a query function that calls a prop',
      code: "function Preview({ loadPreview, orderIds }) { const query = useQuery({ queryKey: ['p', orderIds], queryFn: () => loadPreview({ ids: orderIds }) }) }",
    },
    {
      name: 'other keys are free',
      code: 'function Form({ submit }) { const mutation = useMutation({ mutationFn: submit, onSuccess: () => { setSubmitted(true) } }) }',
    },
    { name: 'a member of the props parameter', code: 'function Cancel(props) { const mutation = useMutation({ mutationFn: props.cancel }) }' },
    { name: 'a prop destructured in the body', code: 'function Cancel(props) { const { cancel } = props; const mutation = useMutation({ mutationFn: cancel }) }' },
    { name: 'a renamed prop', code: 'function Cancel({ cancel: stop }) { const mutation = useMutation({ mutationFn: stop }) }' },
    { name: 'a prop with a default', code: 'const Cancel = ({ cancel = noop } = {}) => { const mutation = useMutation({ mutationFn: cancel }) }' },
    {
      name: 'a block body that awaits a prop call',
      code: 'function Cancel({ cancel }) { const mutation = useMutation({ mutationFn: async (input) => { const result = await cancel(input); return result } }) }',
    },
    { name: 'no function key', code: "function Orders({ enabled }) { const query = useQuery({ queryKey: ['x'], enabled }) }" },
    { name: 'a custom hook', code: "function useOrders({ load }) { return useQuery({ queryKey: ['o'], queryFn: load }) }" },
    { name: 'a hook outside any function', code: 'const query = useQuery(rpc.app.orders.list.queryOptions())' },
    {
      name: 'custom hooks and functions',
      code: 'function Orders({ load }) { const data = useData({ fetcher: load }); const query = useQuery(rpc.app.orders.list.queryOptions()) }',
      options: { hooks: ['useData'], functions: ['fetcher'] },
    },
    {
      name: 'a client call as the mutation function',
      code: 'function Cancel() { const mutation = useMutation({ mutationFn: (input) => rpc.app.orders.schedule.cancel.call(input) }) }',
      errors: ['source'],
    },
    {
      name: 'a fetch as the query function',
      code: "function Orders() { const query = useQuery({ queryKey: ['x'], queryFn: () => fetch('/api/orders').then((response) => response.json()) }) }",
      errors: ['source'],
    },
    { name: 'ready-made options', code: 'function Orders() { const query = useQuery(rpc.app.orders.list.queryOptions()) }', errors: ['options'] },
    { name: 'spread options', code: "function Orders({ options }) { const query = useQuery({ ...options, queryKey: ['x'] }) }", errors: ['options'] },
    { name: 'an import is not a prop', code: "import { cancel } from './api'\nfunction Cancel() { const mutation = useMutation({ mutationFn: cancel }) }", errors: ['source'] },
    { name: 'a module function is not a prop', code: 'function cancel() {}\nfunction Cancel() { const mutation = useMutation({ mutationFn: cancel }) }', errors: ['source'] },
    {
      name: 'a local that shadows a prop name',
      code: 'function Cancel(props) { const cancel = rpc.cancel; const mutation = useMutation({ mutationFn: cancel }) }',
      errors: ['source'],
    },
    {
      name: 'an infinite and a suspense query with client calls',
      code: "function Orders() { const pages = useInfiniteQuery({ queryKey: ['a'], queryFn: () => rpc.app.orders.list.call() }); const one = useSuspenseQuery({ queryKey: ['b'], queryFn: () => rpc.app.orders.get.call() }) }",
      errors: ['source', 'source'],
    },
  ])('$name', (row) => testerRun(reactQueryProps, row))
})
