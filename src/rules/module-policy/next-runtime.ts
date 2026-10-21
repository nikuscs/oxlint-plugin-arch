import { builtinModules } from 'node:module'
import { defineRule } from '@oxlint/plugins'
import type { ESTree, Scope } from '@oxlint/plugins'
import type { ModuleNextRuntimeOptions } from '../../types/module-policy.types.ts'
import { boundaryResolveTarget, optionsFirst } from '../../utils/index.ts'

const SERVER_GLOBALS = ['process', 'Bun', 'Deno', 'Buffer', '__dirname', '__filename', 'require']
const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'location',
  'history',
  'screen',
  'HTMLElement',
  'Element',
  'HTMLInputElement',
  'ResizeObserver',
  'MutationObserver',
  'IntersectionObserver',
  'FileReader',
  'matchMedia',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'alert',
  'confirm',
  'prompt',
]

/**
 * Checks Next.js runtime ownership from file names and directives: `.server`/`.rsc` and `'use server'` modules stay off
 * the browser, `.client` and `'use client'` modules stay off server-only APIs, and shared modules use neither.
 *
 * Example: `chat.client.ts` importing `next/headers` fails; `chat.server.ts` importing it passes.
 */
export const nextRuntime = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          web: { type: 'array', items: { type: 'string' } },
          backend: { type: 'array', items: { type: 'string' } },
          aliases: { type: 'object', additionalProperties: { type: 'string' } },
          backendPackages: { type: 'array', items: { type: 'string' } },
          serverImports: { type: 'array', items: { type: 'string' } },
          clientImports: { type: 'array', items: { type: 'string' } },
          allowComputedImportsIn: { type: 'array', items: { type: 'string' } },
        },
        required: ['web', 'backend', 'aliases', 'backendPackages'],
      },
    ],
    messages: {
      runtime: '{{source}} is not valid here: {{reason}}.',
      directive: "'{{directive}}' does not match this {{side}} module; rename the file or remove the directive.",
      action: "Server actions modules must start with 'use server'.",
      computed:
        'Use a literal dynamic import so runtime ownership can be checked, or declare this exact file in allowComputedImportsIn after reviewing its targets.',
    },
  },
  createOnce(context) {
    let options: ModuleNextRuntimeOptions
    let file = ''
    let server = false
    let client = false
    let shared = false

    function report(node: ESTree.Node, source: string, reason: string) {
      context.report({ node, messageId: 'runtime', data: { source, reason } })
    }

    function check(node: ESTree.Node, source: string, typeOnly: boolean) {
      if (typeOnly) return
      const target = boundaryResolveTarget(options, file, source)
      const matches = (values: string[] | undefined) =>
        values?.some((value) => source === value || source.startsWith(value + '/'))
      const backend =
        options.backend.some((path) => target.startsWith(path + '/')) ||
        options.backendPackages.some(
          (name) =>
            source === name ||
            (source.startsWith(name + '/') && /\/(?:server|rpc)(?:\/|$)/.test(source.slice(name.length))),
        )
      const serverOnly =
        builtinModules.includes(source) ||
        backend ||
        source === '@orpc/server' ||
        /\.(?:server|rsc)(?:\.[cm]?[jt]sx?)?$/.test(target) ||
        /^(?:node:|bun(?::|$)|cloudflare:)/.test(source) ||
        /^(?:server-only|next\/headers|next\/cache|next\/server)$/.test(source) ||
        /^react-dom\/server(?:\.|\/|$)/.test(source) ||
        matches(options.serverImports)
      const clientOnly =
        /(?:\/hooks\/|\.client-only(?:\.|$))/.test(target) ||
        /^(?:client-only|react-dom\/client)$/.test(source) ||
        matches(options.clientImports)

      if (clientOnly && (server || shared)) {
        report(node, source, 'browser-only dependencies do not belong in server, RSC or shared modules')
      } else if (serverOnly && !server) {
        report(
          node,
          source,
          shared
            ? 'shared utilities/constants/lib cannot import server-only dependencies'
            : 'server-only dependencies belong in .server, .rsc or server action modules',
        )
      }
    }

    function global(node: Extract<ESTree.Node, { type: 'Identifier' }>) {
      const serverGlobal = SERVER_GLOBALS.includes(node.name)
      const browserGlobal = BROWSER_GLOBALS.includes(node.name)
      if (!serverGlobal && !browserGlobal) return
      const parent = node.parent
      if (
        (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
        (parent.type === 'Property' && parent.key === node && !parent.computed) ||
        parent.type.startsWith('TS')
      )
        return
      let scope: Scope | null = context.sourceCode.getScope(node)
      while (scope) {
        if (scope.set.get(node.name)?.defs.length) return
        scope = scope.upper
      }
      const publicEnv =
        node.name === 'process' &&
        parent.type === 'MemberExpression' &&
        parent.property.type === 'Identifier' &&
        parent.property.name === 'env' &&
        parent.parent.type === 'MemberExpression' &&
        parent.parent.property.type === 'Identifier' &&
        parent.parent.property.name.startsWith('NEXT_PUBLIC_')
      if (serverGlobal && !server && !publicEnv && (client || shared))
        report(node, node.name, 'server globals are unavailable in browser and shared modules')
      if (browserGlobal && server) report(node, node.name, 'browser globals are unavailable during server execution')
    }

    return {
      Program(program) {
        options = optionsFirst<ModuleNextRuntimeOptions>(context)
        file = context.filename.replaceAll('\\', '/')
        const directives = program.body
          .filter(
            (statement): statement is Extract<ESTree.Statement, { type: 'ExpressionStatement' }> =>
              statement.type === 'ExpressionStatement' && 'directive' in statement && Boolean(statement.directive),
          )
          .map((statement) => ({ node: statement, value: statement.directive ?? '' }))
        const useServer = directives.find((entry) => entry.value === 'use server')
        const useClient = directives.find((entry) => entry.value === 'use client')
        const serverName = /\.(?:server|rsc|action)\.[cm]?[jt]sx?$/.test(file)
        const clientName = /\.client\.[cm]?[jt]sx?$/.test(file)
        shared =
          /\.(?:utils|constants)\.[cm]?[jt]sx?$/.test(file) ||
          options.web.some((path) => file.startsWith(path + '/lib/'))
        server = serverName || Boolean(useServer)
        client = clientName || Boolean(useClient)
        if (useClient && serverName)
          context.report({ node: useClient.node, messageId: 'directive', data: { directive: 'use client', side: 'server' } })
        if (useServer && clientName)
          context.report({ node: useServer.node, messageId: 'directive', data: { directive: 'use server', side: 'client' } })
        if (/\.action\.[cm]?[jt]sx?$/.test(file) && !useServer) context.report({ node: program, messageId: 'action' })
        if (useClient) server = false
      },
      ImportDeclaration(node) {
        const typeOnly =
          node.importKind === 'type' ||
          (node.specifiers.length > 0 &&
            node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'))
        check(node, node.source.value, typeOnly)
        if (typeOnly || !server || node.source.value !== 'react') return
        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind !== 'type' &&
            specifier.imported.type === 'Identifier' &&
            /^use[A-Z]/.test(specifier.imported.name) &&
            !['useId', 'use'].includes(specifier.imported.name)
          )
            report(specifier, specifier.imported.name, 'client hooks do not belong in server or RSC modules')
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source)
          check(
            node,
            node.source.value,
            node.exportKind === 'type' ||
              (node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.exportKind === 'type')),
          )
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value, node.exportKind === 'type')
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal' && typeof node.source.value === 'string') check(node, node.source.value, false)
        else if (!options.allowComputedImportsIn?.includes(file)) context.report({ node, messageId: 'computed' })
      },
      Identifier: global,
    }
  },
})
