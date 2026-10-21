import { test } from 'vitest'
import { nextRuntime } from '../rules/module-policy/next-runtime.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [
  {
    web: ['/repo/web/src'],
    backend: ['/repo/api/src'],
    aliases: { '@api': '/repo/api/src' },
    backendPackages: ['@app/server'],
  },
]
const client = '/repo/web/src/services/chat/chat.client.ts'
const server = '/repo/web/src/services/chat/chat.server.ts'
const rsc = '/repo/web/src/services/chat/chat.rsc.tsx'
const action = '/repo/web/src/services/chat/chat.action.ts'
const utils = '/repo/web/src/services/chat/chat.utils.ts'
const lib = '/repo/web/src/lib/format.ts'
const runtime = { messageId: 'runtime' }

test('Next runtime ownership follows file names and directives', () => {
  createRuleTester('tsx').run('modules/next-runtime', nextRuntime, {
    valid: [
      { filename: server, options, code: "import 'server-only'; import { cookies } from 'next/headers'; export async function chatSession() { return (await cookies()).get('s') }" },
      { filename: server, options, code: "import { readFileSync } from 'node:fs'; export function chatRead() { return readFileSync(process.cwd()) }" },
      { filename: rsc, options, code: "import { headers } from 'next/headers'; export async function ChatRsc() { await headers(); return <p>Hi</p> }" },
      { filename: action, options, code: "'use server'\nimport { revalidatePath } from 'next/cache'; export async function chatSave() { revalidatePath('/') }" },
      { filename: client, options, code: "import { chatSave } from './chat.action'; export function chatSubmit() { return chatSave() }" },
      { filename: client, options, code: "import { useState } from 'react'; export function useChat() { return useState(window.innerWidth) }" },
      { filename: client, options, code: "export const chatEndpoint = process.env.NEXT_PUBLIC_API_URL" },
      { filename: client, options, code: "import type { ChatRow } from './chat.server'; export type ChatCopy = ChatRow" },
      { filename: utils, options, code: 'export function chatTitle(value: string) { return value.trim() }' },
      { filename: server, options, code: 'function chatRead(window: { value: string }) { return window.value }' },
      { filename: '/repo/web/src/services/rpc/rpc.client.ts', options, code: "import { createORPCClient } from '@orpc/client'; export const rpc = createORPCClient(link)" },
    ],
    invalid: [
      { filename: client, options, code: "import { cookies } from 'next/headers'; export const chatRead = () => cookies()", errors: [runtime] },
      { filename: client, options, code: "import { chatRead } from './chat.server'; export const chatLoad = () => chatRead()", errors: [runtime] },
      { filename: client, options, code: "import { router } from '@app/server/rpc'; export const rpcRouter = router", errors: [runtime] },
      { filename: client, options, code: "export const chatSecret = process.env.DATABASE_URL", errors: [runtime] },
      { filename: utils, options, code: "import { readFileSync } from 'node:fs'; export const chatRead = () => readFileSync('a')", errors: [runtime] },
      { filename: lib, options, code: "import { headers } from 'next/headers'; export const libHeaders = () => headers()", errors: [runtime] },
      { filename: server, options, code: "import { createRoot } from 'react-dom/client'; export const chatMount = () => createRoot(document.body)", errors: [runtime, runtime] },
      { filename: server, options, code: "import { useState } from 'react'; export function chatState() { return useState(0) }", errors: [runtime] },
      { filename: rsc, options, code: "export function ChatRsc() { return <p>{window.innerWidth}</p> }", errors: [runtime] },
      { filename: server, options, code: "export { chatPanel } from '../../hooks/use-chat'", errors: [runtime] },
      { filename: server, options, code: "'use client'\nexport const chatRead = () => 1", errors: [{ messageId: 'directive' }] },
      { filename: client, options, code: "'use server'\nexport async function chatSave() {}", errors: [{ messageId: 'directive' }] },
      { filename: action, options, code: 'export async function chatSave() {}', errors: [{ messageId: 'action' }] },
      { filename: client, options, code: 'export const chatLoad = (name: string) => import(name)', errors: [{ messageId: 'computed' }] },
    ],
  })
})
