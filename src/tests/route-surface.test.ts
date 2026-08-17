import { test } from 'vitest'
import { routeSurface } from '../rules/route-surface.ts'
import { createRuleTester } from './rule-tester.ts'

const extraExport = { messageId: 'extraExport' }
const hostJsx = { messageId: 'hostJsx' }
const bannedHook = { messageId: 'bannedHook' }

test('route-surface', () => {
  createRuleTester('tsx').run(
    'arch/route-surface',
    routeSurface,
    {
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
    },
  )
})
