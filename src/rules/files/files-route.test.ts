import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { filesRoute } from './files-route.ts'

describe('arch/files-route', () => {
  it.each([
    {
      name: 'an adapter rendering a page passes',
      code: `function UsersRoute() { const params = Route.useParams(); return <UsersPage id={params.id} /> }
export const Route = createFileRoute('/users')({ component: UsersRoute })`,
    },
    { name: 'a route without an adapter passes', code: "export const Route = createFileRoute('/old')({ beforeLoad: () => { throw redirect({ to: '/' }) } })" },
    { name: 'an allowed extra export passes', code: 'export const Route = {}\nexport const loader = () => null', options: { exports: ['loader'] } },
    {
      name: 'a custom hook list passes other hooks',
      code: 'function UsersRoute() { useMutation(); return <UsersPage /> }\nexport const Route = {}',
      options: { hooks: ['useState'] },
    },
    {
      name: 'intrinsic JSX passes with intrinsic off',
      code: 'function UsersRoute() { return <div /> }\nexport const Route = {}',
      options: { intrinsic: false },
    },
    { name: 'exported functions are skipped by default', code: 'export default function Page() { return <main /> }', options: { export: 'default' } },
    {
      name: 'an inspected default export passes',
      code: `export async function generateMetadata() { return { title: 'Home' } }
export default async function Page() { return <HomePage data={await load()} /> }`,
      options: { export: 'default', exports: ['generateMetadata'], inspect: true },
    },
    {
      name: 'an adapter using route params and a suspense query passes',
      code: "import { ChatPage } from '@/components/chat/chat-page'\nfunction RouteComponent() { const params = Route.useParams(); useSuspenseQuery(options); return <ChatPage id={params.id} /> }\nexport const Route = createFileRoute('/chat')({ component: RouteComponent })",
    },
    {
      name: 'an adapter rendering an outlet passes',
      code: "import { Outlet } from '@tanstack/react-router'\nfunction RouteComponent() { return <Outlet /> }\nexport const Route = createFileRoute('/')({ component: RouteComponent })",
    },
    {
      name: 'an inspected page beside allowed metadata generation passes',
      code: "import { HomePage } from '@/components/home/home-page'\nexport async function generateMetadata() { return { title: 'Home' } }\nexport default function Page() { return <HomePage /> }",
      options: { export: 'default', exports: ['generateMetadata', 'metadata'], inspect: true, hooks: ['useState', 'useEffect'], intrinsic: true },
    },
    {
      name: 'an inspected local arrow beside metadata passes',
      code: "export const metadata = { title: 'Home' }\nconst Page = () => <HomePage />\nexport default Page",
      options: { export: 'default', exports: ['generateMetadata', 'metadata'], inspect: true, hooks: ['useState', 'useEffect'], intrinsic: true },
    },
    {
      name: 'an inspected async page loading data passes',
      code: 'export default async function Page() { const data = await load(); return <HomePage data={data} /> }',
      options: { export: 'default', exports: ['generateMetadata', 'metadata'], inspect: true, hooks: ['useState', 'useEffect'], intrinsic: true },
    },
    { name: 'an extra export', code: 'export const Route = {}\nexport const loader = () => null', errors: ['extraExport'] },
    {
      name: 'an export off a custom name',
      code: 'export const revalidate = 60\nexport default function Page() { return <HomePage /> }',
      options: { export: 'default' },
      errors: ['extraExport'],
    },
    {
      name: 'intrinsic JSX in an adapter',
      code: "function UsersRoute() { return <div /> }\nexport const Route = createFileRoute('/')({ component: UsersRoute })",
      errors: ['hostJsx'],
    },
    {
      name: 'a banned hook in an adapter',
      code: "function UsersRoute() { useState(0); return <UsersPage /> }\nexport const Route = createFileRoute('/')({ component: UsersRoute })",
      errors: ['bannedHook'],
    },
    {
      name: 'a custom banned hook',
      code: 'const UsersRoute = () => { useQuery(); return <UsersPage /> }\nexport const Route = {}',
      options: { hooks: ['useQuery'] },
      errors: ['bannedHook'],
    },
    {
      name: 'an inspected default function',
      code: 'export default function Page() { return <main><HomePage /></main> }',
      options: { export: 'default', inspect: true },
      errors: ['hostJsx'],
    },
    { name: 'an inspected default arrow', code: 'export default () => <main />', options: { export: 'default', inspect: true }, errors: ['hostJsx'] },
    {
      name: 'an inspected hook in a default function',
      code: 'export default function Page() { const [open] = useState(false); return <HomePage open={open} /> }',
      options: { export: 'default', inspect: true },
      errors: ['bannedHook'],
    },
    {
      name: 'a local adapter behind a default export',
      code: 'const Page = () => <div />\nexport default Page',
      options: { export: 'default' },
      errors: ['hostJsx'],
    },
    {
      name: 'intrinsic JSX in a route component',
      code: "function RouteComponent() { return <div /> }\nexport const Route = createFileRoute('/')({ component: RouteComponent })",
      errors: ['hostJsx'],
    },
    {
      name: 'a state hook in a route component',
      code: "function RouteComponent() { useState(0); return <Page /> }\nexport const Route = createFileRoute('/')({ component: RouteComponent })",
      errors: ['bannedHook'],
    },
  ])('$name', (row) => testerRun(filesRoute, row))
})
