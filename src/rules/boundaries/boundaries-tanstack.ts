import { defineRule } from '@oxlint/plugins'
import { astIsTypeOnlyImport, astMemberName, astModuleName, astVisit } from '../../utils/ast.utils.ts'
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
import type * as BoundariesTypes from '../../types/boundaries.types.ts'
import type { ESTree } from '@oxlint/plugins'

const boundariesRenderers = ['renderServerComponent', 'renderToReadableStream']
const boundariesChainMethods = ['handler', 'server', 'client', 'middleware', 'validator', 'inputValidator']
const boundariesSplitFactories = ['createIsomorphicFn', 'createMiddleware']

const boundariesRuntimeTypeWrappers = [
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
  'TSNonNullExpression',
  'TSInstantiationExpression',
  'TSEnumDeclaration',
  'TSEnumBody',
  'TSEnumMember',
  'TSModuleDeclaration',
  'TSModuleBlock',
  'TSParameterProperty',
  'TSExportAssignment',
]

const boundariesClientHookReason = 'client hooks do not belong in server/RSC services'

const boundariesTanstackDefaults: Required<Omit<BoundariesTypes.BoundariesTanstackOptions, 'server' | 'client' | 'dynamic' | 'publicEnv'>> = {
  web: [],
  backend: [],
  aliases: {},
  backendPackages: [],
  rpc: [],
  serverPackages: [
    ...boundariesServerPackages,
    '@tanstack/react-start/server',
    '@tanstack/react-start/server-only',
    '@tanstack/solid-start/server',
    '@tanstack/solid-start/server-only',
    '@tanstack/vue-start/server',
    '@tanstack/vue-start/server-only',
  ],
  clientPackages: ['react-dom/client', '@tanstack/react-start/client-only', '@tanstack/solid-start/client-only', '@tanstack/vue-start/client-only'],
  hookPackages: ['react', '@tanstack/react-query', '@tanstack/react-router'],
  startPackages: ['@tanstack/react-start'],
  rscPackages: ['@tanstack/react-start/rsc', '@tanstack/react-start-rsc'],
}

function boundariesIsClientHook(name: string): boolean {
  return /^use[A-Z]/.test(name) && name !== 'useId'
}

export const boundariesTanstack = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...boundariesRuntimeProperties,
          rpc: { type: 'array', items: { type: 'string' } },
          startPackages: { type: 'array', items: { type: 'string' } },
          rscPackages: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    messages: boundariesRuntimeMessages,
  },
  createOnce(context) {
    let options: BoundariesTypes.BoundariesTanstackOptions & typeof boundariesTanstackDefaults
    let file = ''
    let serverFile = false
    let rscFile = false
    let shared = false
    const runtimeIdentifiers = new Set<number>()
    let referenced: Set<number> | undefined
    let imports = new Map<string, BoundariesTypes.BoundariesTanstackImport>()
    const boundaries: BoundariesTypes.BoundariesTanstackBoundary[] = []

    function imported(node: BoundariesTypes.BoundariesIdentifier): string | undefined {
      const entry = imports.get(node.name)
      const variable = entry ? boundariesDeclaredVariable(context.sourceCode.getScope(node), node.name) : null
      return entry && variable?.defs.some((definition) => definition.name.range[0] === entry.node.start) ? entry.name : undefined
    }

    function factory(node: ESTree.Node): string | undefined {
      if (node.type === 'Identifier') {
        return imported(node)
      }

      if (node.type === 'CallExpression') {
        return factory(node.callee)
      }

      const property = node.type === 'MemberExpression' ? astMemberName(node) : undefined

      if (node.type !== 'MemberExpression' || !property) {
        return undefined
      }

      if (node.object.type === 'Identifier' && imported(node.object) === '*') {
        return property
      }

      return boundariesChainMethods.includes(property) ? factory(node.object) : undefined
    }

    function boundary(position: number): BoundariesTypes.BoundariesTanstackBoundary | undefined {
      return boundaries.reduce<BoundariesTypes.BoundariesTanstackBoundary | undefined>(
        (inner, entry) => (position >= entry.start && position < entry.end && (!inner || entry.start > inner.start) ? entry : inner),
        undefined,
      )
    }

    function clientSide(position: number): boolean {
      return boundary(position)?.side === 'client'
    }

    function serverPosition(position: number, staticImport = false): boolean {
      const entry = boundary(position)

      if (!entry) {
        return serverFile
      }

      return entry.side === 'server' && (!staticImport || entry.kind !== 'createIsomorphicFn' || options.rpc.includes(file))
    }

    function runtimeReferences(node: ESTree.ImportDeclaration, localName?: string): number[] {
      return context.sourceCode
        .getDeclaredVariables(node)
        .filter((variable) => localName === undefined || variable.name === localName)
        .flatMap((variable) => variable.references.map((reference) => reference.identifier.range[0]))
        .filter((position) => runtimeIdentifiers.has(position))
    }

    function check(node: ESTree.Node, source: string, typeOnly: boolean, reExport = false, renderer?: ESTree.ImportSpecifier): void {
      if (typeOnly) {
        return
      }

      const target = boundariesResolveTarget(options, file, source)

      const clientImport =
        /(?:\/hooks\/|\.client-only(?:\.|$))/.test(target) ||
        boundariesMatchesImport(options.clientPackages, source) ||
        boundariesMatchesImport(options.client, source)

      if (clientImport && (serverFile || rscFile || shared) && !clientSide(node.start)) {
        const references = node.type === 'ImportDeclaration' ? runtimeReferences(node) : []

        if (shared || references.length === 0 || !references.every(clientSide)) {
          boundariesReport(context, node, source, 'browser-only dependencies do not belong in server/RSC or shared modules')
        }

        return
      }

      const serverImport =
        boundariesIsServerPlatformImport(source, options.serverPackages) ||
        boundariesIsBackendImport(options, target, source) ||
        /\.server(?:\.[cm]?[jt]sx?)?$/.test(target) ||
        boundariesMatchesImport(options.server, source)

      if (!renderer && !serverImport) {
        return
      }

      if (shared) {
        boundariesReport(context, node, source, 'shared utilities/constants/lib cannot import runtime server dependencies')
        return
      }

      if (reExport && !serverFile) {
        boundariesReport(context, node, source, 'server dependencies must not be re-exported as a public runtime API')
        return
      }

      if (node.type === 'ImportDeclaration') {
        if (serverFile) {
          return
        }

        const references = runtimeReferences(node, renderer?.local.name)

        if (references.length > 0 && references.every((position) => serverPosition(position, true))) {
          return
        }
      } else if (serverPosition(node.start)) {
        return
      }
      boundariesReport(
        context,
        node,
        source,
        'use an inline imported TanStack server boundary; static isomorphic server imports belong only to the configured RPC owner',
      )
    }

    return {
      Program(program) {
        options = { ...boundariesTanstackDefaults, ...optionsFirst<BoundariesTypes.BoundariesTanstackOptions>(context) }
        file = context.filename.replaceAll('\\', '/')
        serverFile = /\.server\.[cm]?[jt]sx?$/.test(file)
        rscFile = /\.rsc\.[cm]?[jt]sx?$/.test(file)
        shared = boundariesIsSharedFile(options, file)
        runtimeIdentifiers.clear()
        referenced = undefined
        boundaries.length = 0
        imports = new Map(
          program.body.flatMap((statement): [string, BoundariesTypes.BoundariesTanstackImport][] => {
            if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') {
              return []
            }

            const source = statement.source.value
            return statement.specifiers.flatMap((specifier): [string, BoundariesTypes.BoundariesTanstackImport][] => {
              const entry = (name: string): [string, BoundariesTypes.BoundariesTanstackImport][] => [[specifier.local.name, { node: specifier.local, name }]]

              if (options.hookPackages.includes(source)) {
                return specifier.type === 'ImportSpecifier' ? [] : entry('client-hooks')
              }

              if (options.rscPackages.includes(source)) {
                return specifier.type === 'ImportNamespaceSpecifier' ? entry('rsc-renderers') : []
              }

              if (!options.startPackages.includes(source)) {
                return []
              }

              if (specifier.type === 'ImportNamespaceSpecifier') {
                return entry('*')
              }

              if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') {
                return []
              }

              return entry(astModuleName(specifier.imported))
            })
          }),
        )
        astVisit(program, [], (node, ancestors) => {
          if (
            node.type === 'Identifier' &&
            !ancestors.some(
              (ancestor) =>
                ancestor.type.startsWith('TS') &&
                (!boundariesRuntimeTypeWrappers.includes(ancestor.type) ||
                  ((ancestor.type === 'TSEnumDeclaration' || ancestor.type === 'TSModuleDeclaration') && ancestor.declare)),
            )
          ) {
            runtimeIdentifiers.add(node.start)
          }

          if (node.type !== 'CallExpression') {
            return
          }

          const kind = factory(node.callee)
          const method = node.callee.type === 'MemberExpression' ? astMemberName(node.callee) : undefined
          const split = kind !== undefined && boundariesSplitFactories.includes(kind)
          const serverSide = kind === 'createServerOnlyFn' || (kind === 'createServerFn' && method === 'handler') || (split && method === 'server')
          const clientSideCall = kind === 'createClientOnlyFn' || (split && method === 'client')
          const callback = node.arguments.at(0)

          if (kind && (serverSide || clientSideCall) && (callback?.type === 'FunctionExpression' || callback?.type === 'ArrowFunctionExpression')) {
            boundaries.push({
              start: callback.start,
              end: callback.end,
              side: serverSide ? 'server' : 'client',
              kind,
            })
          }
        })
      },
      ImportDeclaration(node) {
        const typeOnly = astIsTypeOnlyImport(node)
        check(node, node.source.value, typeOnly)
        if (typeOnly) {
          return
        }

        for (const specifier of node.specifiers) {
          if (
            options.rscPackages.includes(node.source.value) &&
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind !== 'type' &&
            specifier.imported.type === 'Identifier' &&
            boundariesRenderers.includes(specifier.imported.name)
          ) {
            check(node, node.source.value, false, false, specifier)
          }
        }

        if (!(serverFile || rscFile) || !options.hookPackages.includes(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type !== 'ImportSpecifier' ||
            specifier.importKind === 'type' ||
            specifier.imported.type !== 'Identifier' ||
            !boundariesIsClientHook(specifier.imported.name)
          ) {
            continue
          }

          const references = runtimeReferences(node, specifier.local.name)

          if (references.length === 0 || !references.every(clientSide)) {
            boundariesReport(context, specifier, specifier.imported.name, boundariesClientHookReason)
          }
        }
      },
      ...boundariesExportVisitors(check),
      ImportExpression(node) {
        boundariesImportExpression(context, node, Boolean(options.dynamic?.includes(file)), (source) => check(node, source, false))
      },
      MemberExpression(node) {
        const name = boundariesMemberName(node)

        if (!name || node.object.type !== 'Identifier') {
          return
        }

        const kind = imported(node.object)

        if (kind === 'rsc-renderers' && boundariesRenderers.includes(name) && (shared || !serverPosition(node.start, true))) {
          boundariesReport(context, node, name, 'server renderers require a server execution boundary')
        }

        if ((serverFile || rscFile) && kind === 'client-hooks' && boundariesIsClientHook(name) && !clientSide(node.start)) {
          boundariesReport(context, node, name, boundariesClientHookReason)
        }
      },
      Identifier(node) {
        const member = node.parent.type === 'MemberExpression' && node.parent.object === node && node.name === 'globalThis' ? node.parent : undefined
        const name = boundariesMemberName(member) ?? node.name
        const serverGlobal = boundariesServerGlobals.includes(name)
        const browserGlobal = boundariesBrowserGlobals.includes(name)

        if (!serverGlobal && !browserGlobal) {
          return
        }

        if (boundariesDeclaredVariable(context.sourceCode.getScope(node), node.name)) {
          return
        }

        referenced ??= new Set(
          context.sourceCode.scopeManager.scopes.flatMap((scope) => scope.references.map((reference) => reference.identifier.range[0])),
        )

        if (!referenced.has(node.start) || !runtimeIdentifiers.has(node.start)) {
          return
        }

        if (serverGlobal && (shared || !serverPosition(node.start))) {
          boundariesReport(context, node, name, 'server globals require a server execution boundary')
        }

        const entry = boundary(node.start)

        if (browserGlobal && (entry ? entry.side === 'server' : serverFile || rscFile)) {
          boundariesReport(context, node, name, 'browser globals are unavailable during server execution')
        }
      },
    }
  },
})
