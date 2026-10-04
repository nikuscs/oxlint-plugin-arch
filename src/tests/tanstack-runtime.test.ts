import { test } from 'vitest'
import { tanstackRuntime } from '../rules/module-policy/tanstack-runtime.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{
  web: ['/repo/web/src', '/repo/admin/src'], backend: ['/repo/api/src'], aliases: { '@web': '/repo/web/src', '@api': '/repo/api/src' },
  backendPackages: ['@app/server'], rpcClients: ['/repo/web/src/services/rpc/rpc.client.ts'],
}]
const client = '/repo/web/src/services/chat/chat.client.ts'
const server = '/repo/web/src/services/chat/chat.server.ts'
const rsc = '/repo/web/src/services/chat/chat.rsc.tsx'
const error = { messageId: 'runtime' }

test('TanStack imported boundaries permit server dependencies only in the correct execution scope', () => {
  createRuleTester('tsx').run('modules/tanstack-runtime', tanstackRuntime, {
    valid: [
      { filename: client, options, code: "export { type Chat } from './chat.server'" },
      { filename: server, options, code: "export { read } from './chat.server'" },
      { filename: server, options, code: "import { createClientOnlyFn } from '@tanstack/react-start'; import { createRoot } from 'react-dom/client'; export const chatMount = createClientOnlyFn(() => createRoot(document.body))" },
      { filename: client, options, code: "import { createServerFn as serverFn } from '@tanstack/react-start'; import { read } from './chat.server'; export const chatRead = serverFn().handler(() => read())" },
      { filename: client, options, code: "import * as start from '@tanstack/react-start'; export const chatRead = start.createServerFn().handler(async () => (await import('./chat.server')).read())" },
      { filename: client, options, code: "import { createIsomorphicFn } from '@tanstack/react-start'; export const chatRead = createIsomorphicFn().server(async () => (await import('node:fs')).readFileSync('path')).client(() => 'client')" },
      { filename: options[0].rpcClients[0], options, code: "import { createIsomorphicFn } from '@tanstack/react-start'; import { read } from '@app/server/rpc'; export const rpcRead = createIsomorphicFn().server(() => read()).client(() => 'client')" },
      { filename: server, options, code: "import { readFileSync } from 'node:fs'; export function chatRead() { return readFileSync('path') }" },
      { filename: rsc, options, code: "import { createServerFn } from '@tanstack/react-start'; import { renderToString } from 'react-dom/server'; export const chatRscRead = createServerFn().handler(() => renderToString(<p>Hello</p>))" },
      { filename: client, options, code: "import type { Chat } from './chat.server'; export type ChatCopy = Chat" },
      { filename: server, options, code: "function chatRead(window) { return window.value }" },
      { filename: server, options, code: "import { createIsomorphicFn } from '@tanstack/react-start'; export const chatRead = createIsomorphicFn().server(() => 'server').client(() => window.location.href)" },
    ],
    invalid: [
      { filename: client, options, code: "import { readFileSync } from 'fs'; export const chatRead = () => readFileSync('file')", errors: [error] },
      { filename: client, options, code: "import { renderServerComponent } from '@tanstack/react-start/rsc'; export const chatRead = () => renderServerComponent('hello')", errors: [error] },
      { filename: server, options, code: "export const chatRead = () => globalThis['document'].title", errors: [error] },
      { filename: server, options, code: "export const chatRead = () => new ResizeObserver(listener)", errors: [error] },
      { filename: rsc, options, code: "import * as React from 'react'; export const chatRscRead = () => React['useState'](1)", errors: [error] },
      { filename: client, options, code: "import { read } from './chat.server'; export const chatRead = () => read()", errors: [error] },
      { filename: client, options, code: "import { read } from '@web/services/chat/chat.server'; export const chatRead = () => read()", errors: [error] },
      { filename: client, options, code: "export { read } from './chat.server'", errors: [error] },
      { filename: client, options, code: "export * from './chat.server'", errors: [error] },
      { filename: client, options, code: "import { read } from './chat.server'; export { read }", errors: [error] },
      { filename: client, options, code: "export const chatRead = () => import('./chat.server')", errors: [error] },
      { filename: client, options, code: "const createServerFn = () => other; export const chatRead = createServerFn().handler(() => process.env.SECRET)", errors: [error] },
      { filename: client, options, code: "import { createServerFn } from '@tanstack/react-start'; function chatRead(createServerFn) { return createServerFn().handler(() => process.env.SECRET) }", errors: [error] },
      { filename: client, options, code: "import { createIsomorphicFn } from '@tanstack/react-start'; import { read } from './chat.server'; export const chatRead = createIsomorphicFn().server(() => read()).client(() => 'client')", errors: [error] },
      { filename: options[0].rpcClients[0], options, code: "import { createIsomorphicFn } from '@tanstack/react-start'; import { read } from '@app/server/rpc'; export const rpcRead = createIsomorphicFn().server(() => read()).client(() => read())", errors: [error] },
      { filename: client, options, code: "export const chatRead = () => process.env.SECRET", errors: [error] },
      { filename: server, options, code: "export const chatRead = () => window.location.href", errors: [error] },
      { filename: rsc, options, code: "import { useState as state } from 'react'; export const chatRscRead = () => state(1)", errors: [error] },
      { filename: server, options, code: "import { useChat } from '../../hooks/use-chat'; export const chatRead = () => useChat()", errors: [error] },
    ],
  })
})

test('shared modules cannot launder runtime dependencies and computed exceptions are exact-file', () => {
  const shared = '/repo/web/src/services/chat/chat.utils.ts'
  createRuleTester().run('modules/tanstack-runtime', tanstackRuntime, {
    valid: [
      { filename: shared, options, code: "import { schema } from '@app/server/client'" },
      { filename: server, options: [{ ...options[0], allowComputedImportsIn: [server] }], code: 'export const chatRead = (path) => import(path)' },
    ],
    invalid: [
      ...['chat.utils.ts', 'chat.constants.ts'].map((name) => ({ filename: '/repo/web/src/services/chat/' + name, options, code: "import { read } from './chat.server'", errors: [error] })),
      { filename: '/repo/web/src/lib/chat.ts', options, code: "import { readFileSync } from 'node:fs'", errors: [error] },
      { filename: client, options, code: "export const chatRead = (path) => import(path)", errors: [{ messageId: 'computed' }] },
      { filename: '/repo/admin/src/services/chat/chat.server.ts', options: [{ ...options[0], allowComputedImportsIn: [server] }], code: 'export const chatRead = (path) => import(path)', errors: [{ messageId: 'computed' }] },
    ],
  })
})
