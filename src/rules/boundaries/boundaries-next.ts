import { defineRule } from '@oxlint/plugins'
import { astIsTypeOnlyImport } from '../../utils/ast.utils.ts'
import {
  boundariesBrowserGlobals,
  boundariesDeclaredVariable,
  boundariesExportVisitors,
  boundariesImportExpression,
  boundariesIsBackendImport,
  boundariesIsServerPlatformImport,
  boundariesIsSharedFile,
  boundariesMatchesImport,
  boundariesMemberName,
  boundariesReport,
  boundariesResolveTarget,
  boundariesRuntimeMessages,
  boundariesRuntimeProperties,
  boundariesServerGlobals,
  boundariesServerPackages,
} from '../../utils/boundaries.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BoundariesIdentifier, BoundariesNextOptions } from '../../types/boundaries.types.ts'
import type { ESTree } from '@oxlint/plugins'

const boundariesClientHookReason = 'client hooks do not belong in server, RSC or shared modules'

const boundariesNextDefaults = {
  serverPackages: [...boundariesServerPackages, 'server-only', 'next/headers', 'next/cache', 'next/server'],
  clientPackages: ['client-only', 'react-dom/client'],
  hookPackages: ['react'],
  publicEnv: 'NEXT_PUBLIC_',
}

function boundariesIsClientHook(name: string): boolean {
  return /^use[A-Z]/.test(name) && name !== 'useId' && name !== 'use'
}

export const boundariesNext = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { ...boundariesRuntimeProperties, publicEnv: { type: 'string' } },
        required: ['web', 'backend', 'aliases', 'backendPackages'],
      },
    ],
    messages: {
      ...boundariesRuntimeMessages,
      directive: "'{{directive}}' does not match this {{side}} module; rename the file or remove the directive.",
      action: "Server actions modules must start with 'use server'.",
    },
  },
  createOnce(context) {
    let options: BoundariesNextOptions & typeof boundariesNextDefaults
    let file = ''
    let server = false
    let client = false
    let shared = false
    const reactNamespaces = new Set<ESTree.Node>()

    function check(node: ESTree.Node, source: string, typeOnly: boolean): void {
      if (typeOnly) {
        return
      }

      const target = boundariesResolveTarget(options, file, source)

      const clientOnly =
        /(?:\/hooks\/|\.client-only(?:\.|$))/.test(target) ||
        boundariesMatchesImport(options.clientPackages, source) ||
        boundariesMatchesImport(options.client, source)

      if (clientOnly && (server || shared)) {
        boundariesReport(context, node, source, 'browser-only dependencies do not belong in server, RSC or shared modules')
        return
      }

      const serverOnly =
        boundariesIsServerPlatformImport(source, options.serverPackages) ||
        boundariesIsBackendImport(options, target, source) ||
        /\.(?:server|rsc)(?:\.[cm]?[jt]sx?)?$/.test(target) ||
        boundariesMatchesImport(options.server, source)

      if (!serverOnly || server) {
        return
      }
      boundariesReport(
        context,
        node,
        source,
        shared
          ? 'shared utilities/constants/lib cannot import server-only dependencies'
          : 'server-only dependencies belong in .server, .rsc or server action modules',
      )
    }

    return {
      Program(program) {
        options = { ...boundariesNextDefaults, ...optionsFirst<BoundariesNextOptions>(context) }
        reactNamespaces.clear()
        file = context.filename.replaceAll('\\', '/')
        const directives = new Map<string, ESTree.Node>()

        for (const statement of program.body) {
          if (statement.type === 'ExpressionStatement' && statement.directive && !directives.has(statement.directive)) {
            directives.set(statement.directive, statement)
          }
        }

        const useServer = directives.get('use server')
        const useClient = directives.get('use client')
        const serverName = /\.(?:server|rsc|action)\.[cm]?[jt]sx?$/.test(file)
        const clientName = /\.client\.[cm]?[jt]sx?$/.test(file)
        shared = boundariesIsSharedFile(options, file)
        server = !useClient && (serverName || Boolean(useServer))
        client = clientName || Boolean(useClient)
        if (useClient && serverName) {
          context.report({
            node: useClient,
            messageId: 'directive',
            data: { directive: 'use client', side: 'server' },
          })
        }

        if (useServer && clientName) {
          context.report({
            node: useServer,
            messageId: 'directive',
            data: { directive: 'use server', side: 'client' },
          })
        }

        if (/\.action\.[cm]?[jt]sx?$/.test(file) && !useServer) {
          context.report({ node: program, messageId: 'action' })
        }
      },
      ImportDeclaration(node) {
        const typeOnly = astIsTypeOnlyImport(node)
        check(node, node.source.value, typeOnly)
        if (typeOnly || !(server || shared) || !options.hookPackages.includes(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            reactNamespaces.add(specifier)
            continue
          }

          if (specifier.importKind !== 'type' && specifier.imported.type === 'Identifier' && boundariesIsClientHook(specifier.imported.name)) {
            boundariesReport(context, specifier, specifier.imported.name, boundariesClientHookReason)
          }
        }
      },
      MemberExpression(node) {
        const name = boundariesMemberName(node)

        if (!name || !boundariesIsClientHook(name) || node.object.type !== 'Identifier') {
          return
        }

        const binding = boundariesDeclaredVariable(context.sourceCode.getScope(node.object), node.object.name)?.defs[0]?.node

        if (binding && reactNamespaces.has(binding)) {
          boundariesReport(context, node, `${node.object.name}.${name}`, boundariesClientHookReason)
        }
      },
      ...boundariesExportVisitors(check),
      ImportExpression(node) {
        boundariesImportExpression(context, node, Boolean(options.dynamic?.includes(file)), (source) => check(node, source, false))
      },
      'Program:exit'() {
        const scope = context.sourceCode.scopeManager.scopes.at(0)

        if (!scope) {
          return
        }

        const implicit = [...scope.set.values()].filter((variable) => !variable.defs.length)

        const references = [...scope.through, ...implicit.flatMap((variable) => variable.references)]
          .map((reference): ESTree.Node => reference.identifier)
          .filter(
            (node): node is BoundariesIdentifier =>
              node.type === 'Identifier' && !['TSTypeQuery', 'TSQualifiedName', 'TSTypeReference'].includes(node.parent.type),
          )

        for (const reference of references) {
          const owned = reference.name === 'globalThis' ? boundariesMemberName(reference.parent) : null
          const name = owned ?? reference.name
          const serverGlobal = boundariesServerGlobals.includes(name)
          const browserGlobal = boundariesBrowserGlobals.includes(name)

          if (!serverGlobal && !browserGlobal) {
            continue
          }

          const node: ESTree.Node = owned ? reference.parent : reference
          const env = node.parent
          const key = env?.parent

          const publicEnv =
            name === 'process' &&
            env?.type === 'MemberExpression' &&
            boundariesMemberName(env) === 'env' &&
            env.object === node &&
            key?.type === 'MemberExpression' &&
            key.object === env &&
            (boundariesMemberName(key) ?? '').startsWith(options.publicEnv)

          if (serverGlobal && !server && (client || shared) && !publicEnv) {
            boundariesReport(context, node, name, 'server globals are unavailable in browser and shared modules')
          }

          if (browserGlobal && server) {
            boundariesReport(context, node, name, 'browser globals are unavailable during server execution')
          }
        }
      },
    }
  },
})
