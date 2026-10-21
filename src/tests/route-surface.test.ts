import { test } from 'vitest'
import { routeSurface } from '../rules/route-surface.ts'
import { createRuleTester } from './rule-tester.ts'

const extraExport = { messageId: 'extraExport' }
const hostJsx = { messageId: 'hostJsx' }
const bannedHook = { messageId: 'bannedHook' }

test('route-surface', () => {
  createRuleTester('tsx').run('arch/route-surface', routeSurface, {
    valid: [
      "import { ChatPage } from '@/components/chat/chat-page'\nfunction RouteComponent() { const params = Route.useParams(); useSuspenseQuery(options); return <ChatPage id={params.id} /> }\nexport const Route = createFileRoute('/chat')({ component: RouteComponent })",
      "import { Outlet } from '@tanstack/react-router'\nfunction RouteComponent() { return <Outlet /> }\nexport const Route = createFileRoute('/')({ component: RouteComponent })",
      "export const Route = createFileRoute('/old')({ beforeLoad: () => { throw redirect({ to: '/' }) } })",
    ],
    invalid: [
      {
        code: 'export const Route = {}\nexport const loader = () => null',
        errors: [extraExport],
      },
      {
        code: "function RouteComponent() { return <div /> }\nexport const Route = createFileRoute('/')({ component: RouteComponent })",
        errors: [hostJsx],
      },
      {
        code: "function RouteComponent() { useState(0); return <Page /> }\nexport const Route = createFileRoute('/')({ component: RouteComponent })",
        errors: [bannedHook],
      },
    ],
  })
})

test('route-surface admits framework exports and inspects the exported component when configured', () => {
  const options = [{ exportName: 'default', allowedExports: ['generateMetadata', 'metadata'], inspectExports: true, bannedHooks: ['useState', 'useEffect'], banIntrinsicJsx: true }]
  createRuleTester('tsx').run('arch/route-surface', routeSurface, {
    valid: [
      { code: "import { HomePage } from '@/components/home/home-page'\nexport async function generateMetadata() { return { title: 'Home' } }\nexport default function Page() { return <HomePage /> }", options },
      { code: "export const metadata = { title: 'Home' }\nconst Page = () => <HomePage />\nexport default Page", options },
      { code: "export default async function Page() { const data = await load(); return <HomePage data={data} /> }", options },
    ],
    invalid: [
      { code: "export const revalidate = 60\nexport default function Page() { return <HomePage /> }", options, errors: [extraExport] },
      { code: "export default function Page() { return <main><HomePage /></main> }", options, errors: [hostJsx] },
      { code: "export default function Page() { const [open] = useState(false); return <HomePage open={open} /> }", options, errors: [bannedHook] },
      { code: "const Page = () => <div />\nexport default Page", options, errors: [hostJsx] },
    ],
  })
})
