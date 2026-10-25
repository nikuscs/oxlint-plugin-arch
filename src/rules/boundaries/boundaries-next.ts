import { defineRule } from '@oxlint/plugins'
import type { ESTree, Scope } from '@oxlint/plugins'
import type { ModuleNextRuntimeOptions } from '../../types/module-policy.types.ts'
import {
  boundaryResolveTarget,
  optionsFirst,
  runtimeBrowserGlobals,
  runtimeIsBackendImport,
  runtimeIsServerPlatformImport,
  runtimeMatchesImport,
  runtimeMemberName,
  runtimeServerGlobals,
} from '../../utils/index.ts'

/**
 * Checks Next.js runtime ownership from file names and directives: `.server`/`.rsc` and `'use server'` modules stay off
 * the browser, `.client` and `'use client'` modules stay off server-only APIs, and shared modules use neither.
 *
 * Example: `chat.client.ts` importing `next/headers` fails; `chat.server.ts` importing it passes.
 */
export const boundariesNext = defineRule({
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
    const reactNamespaces = new Set<ESTree.Node>()

    function report(node: ESTree.Node, source: string, reason: string) {
      context.report({ node, messageId: 'runtime', data: { source, reason } })
    }

    function check(node: ESTree.Node, source: string, typeOnly: boolean) {
      if (typeOnly) return
      const target = boundaryResolveTarget(options, file, source)
      const serverOnly =
        runtimeIsServerPlatformImport(source) ||
        runtimeIsBackendImport(options, target, source) ||
        /\.(?:server|rsc)(?:\.[cm]?[jt]sx?)?$/.test(target) ||
        /^(?:server-only|next\/headers|next\/cache|next\/server)$/.test(source) ||
        runtimeMatchesImport(options.serverImports, source)
      const clientOnly =
        /(?:\/hooks\/|\.client-only(?:\.|$))/.test(target) ||
        /^(?:client-only|react-dom\/client)$/.test(source) ||
        runtimeMatchesImport(options.clientImports, source)

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

    function resolve(node: Extract<ESTree.Node, { type: 'Identifier' }>) {
      let scope: Scope | null = context.sourceCode.getScope(node)
      while (scope) {
        const variable = scope.set.get(node.name)
        if (variable?.defs.length) return variable
        scope = scope.upper
      }
      return null
    }

    function clientHook(name: string) {
      return /^use[A-Z]/.test(name) && !['useId', 'use'].includes(name)
    }

    function inType(node: ESTree.Node) {
      return ['TSTypeQuery', 'TSQualifiedName', 'TSTypeReference'].includes(node.parent?.type ?? '')
    }

    // Unresolved runtime references only: declarations, property keys and erased type positions are not globals.
    function globalReferences() {
      const scope = context.sourceCode.scopeManager.scopes[0]
      if (!scope) return []
      const implicit = [...scope.set.values()].filter((variable) => !variable.defs.length)
      return [...scope.through, ...implicit.flatMap((variable) => variable.references)]
        .map((reference) => reference.identifier)
        .filter((node): node is Extract<ESTree.Node, { type: 'Identifier' }> => node.type === 'Identifier' && !inType(node))
    }

    function global(reference: Extract<ESTree.Node, { type: 'Identifier' }>) {
      // `globalThis.window` reaches the same global as a bare `window`.
      const owned = reference.name === 'globalThis' ? runtimeMemberName(reference.parent) : null
      const name = owned ?? reference.name
      const serverGlobal = runtimeServerGlobals.includes(name)
      const browserGlobal = runtimeBrowserGlobals.includes(name)
      if (!serverGlobal && !browserGlobal) return
      const node: ESTree.Node = owned ? reference.parent : reference
      const env: ESTree.Node | null = node.parent
      const key: ESTree.Node | null | undefined = env?.parent
      const publicEnv =
        name === 'process' &&
        runtimeMemberName(env) === 'env' &&
        env?.type === 'MemberExpression' &&
        env.object === node &&
        key?.type === 'MemberExpression' &&
        key.object === env &&
        (runtimeMemberName(key) ?? '').startsWith('NEXT_PUBLIC_')
      if (serverGlobal && !server && !publicEnv && (client || shared))
        report(node, name, 'server globals are unavailable in browser and shared modules')
      if (browserGlobal && server) report(node, name, 'browser globals are unavailable during server execution')
    }

    return {
      Program(program) {
        options = optionsFirst<ModuleNextRuntimeOptions>(context)
        reactNamespaces.clear()
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
        if (typeOnly || !(server || shared) || node.source.value !== 'react') return
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') reactNamespaces.add(specifier)
          else if (
            specifier.importKind !== 'type' &&
            specifier.imported.type === 'Identifier' &&
            clientHook(specifier.imported.name)
          )
            report(specifier, specifier.imported.name, 'client hooks do not belong in server, RSC or shared modules')
        }
      },
      MemberExpression(node) {
        const name = runtimeMemberName(node)
        if (!name || !clientHook(name) || node.object.type !== 'Identifier') return
        const binding = resolve(node.object)?.defs[0]?.node
        if (binding && reactNamespaces.has(binding))
          report(node, `${node.object.name}.${name}`, 'client hooks do not belong in server, RSC or shared modules')
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
      'Program:exit'() {
        for (const reference of globalReferences()) global(reference)
      },
    }
  },
})
