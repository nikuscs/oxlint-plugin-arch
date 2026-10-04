import { builtinModules } from 'node:module'
import { defineRule } from '@oxlint/plugins'
import type { ESTree, Scope } from '@oxlint/plugins'
import type { ModuleRuntimeOptions } from '../../types/module-policy.types.ts'
import { astVisit, boundaryResolveTarget, optionsFirst } from '../../utils/index.ts'

/** Check direct runtime dependencies and imported TanStack boundaries; compilation still owns graph isolation. */
export const tanstackRuntime = defineRule({
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
          rpcClients: { type: 'array', items: { type: 'string' } },
          serverImports: { type: 'array', items: { type: 'string' } },
          clientImports: { type: 'array', items: { type: 'string' } },
          allowComputedImportsIn: { type: 'array', items: { type: 'string' } },
        },
        required: ['web', 'backend', 'aliases', 'backendPackages', 'rpcClients'],
      },
    ],
    messages: {
      runtime: '{{source}} is not valid here: {{reason}}.',
      computed:
        'Use a literal dynamic import so runtime ownership can be checked, or declare this exact file in allowComputedImportsIn after reviewing its targets.',
    },
  },
  createOnce(context) {
    let options: ModuleRuntimeOptions
    let file = ''
    let serverFile = false
    let rscFile = false
    let shared = false
    const runtimeIdentifiers = new Set<number>()
    const imports = new Map<string, { node: Extract<ESTree.Node, { type: 'Identifier' }>; name: string }>()
    const boundaries: { start: number; end: number; side: 'server' | 'client'; kind: string }[] = []
    function imported(node: Extract<ESTree.Node, { type: 'Identifier' }>): string | undefined {
      const entry = imports.get(node.name)
      if (!entry) return undefined
      let scope: Scope | null = context.sourceCode.getScope(node)
      while (scope) {
        const variable = scope.set.get(node.name)
        if (variable)
          return variable.defs.some((definition) => definition.name.range[0] === entry.node.start)
            ? entry.name
            : undefined
        scope = scope.upper
      }
      return undefined
    }
    function factory(node: ESTree.Node): string | undefined {
      if (node.type === 'Identifier') return imported(node)
      if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
        if (node.object.type === 'Identifier' && imported(node.object) === '*') return node.property.name
        if (['handler', 'server', 'client', 'middleware', 'validator', 'inputValidator'].includes(node.property.name))
          return factory(node.object)
      }
      if (node.type === 'CallExpression') return factory(node.callee)
      return undefined
    }
    function boundary(position: number) {
      return boundaries
        .filter((entry) => position >= entry.start && position < entry.end)
        .sort((a, b) => b.start - a.start)[0]
    }
    function serverPosition(position: number, staticImport = false): boolean {
      const entry = boundary(position)
      if (entry)
        return (
          entry.side === 'server' &&
          (!staticImport || entry.kind !== 'createIsomorphicFn' || options.rpcClients.includes(file))
        )
      return serverFile
    }
    function report(node: ESTree.Node, source: string, reason: string) {
      context.report({ node, messageId: 'runtime', data: { source, reason } })
    }
    function check(
      node: ESTree.Node,
      source: string,
      typeOnly: boolean,
      reExport = false,
      renderer?: ESTree.ImportSpecifier,
    ) {
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
      const server =
        Boolean(renderer) ||
        builtinModules.includes(source) ||
        source === '@orpc/server' ||
        backend ||
        /\.server(?:\.[cm]?[jt]sx?)?$/.test(target) ||
        /^(?:node:|bun(?::|$)|cloudflare:)/.test(source) ||
        /^@tanstack\/(?:react|solid|vue)-start\/(?:server|server-only)(?:\/|$)/.test(source) ||
        /^react-dom\/server(?:\.|\/|$)/.test(source) ||
        matches(options.serverImports)
      const client =
        /(?:\/hooks\/|\.client-only(?:\.|$))/.test(target) ||
        /^(?:react-dom\/client|@tanstack\/(?:react|solid|vue)-start\/client-only)(?:\/|$)/.test(source) ||
        matches(options.clientImports)
      if (client && (serverFile || rscFile || shared) && boundary(node.start)?.side !== 'client') {
        const references =
          node.type === 'ImportDeclaration'
            ? context.sourceCode
                .getDeclaredVariables(node)
                .flatMap((variable) =>
                  variable.references.filter((reference) => runtimeIdentifiers.has(reference.identifier.range[0])),
                )
            : []
        if (
          !shared &&
          references.length &&
          references.every((reference) => boundary(reference.identifier.range[0])?.side === 'client')
        )
          return
        report(node, source, 'browser-only dependencies do not belong in server/RSC or shared modules')
        return
      }
      if (!server) return
      if (shared) {
        report(node, source, 'shared utilities/constants/lib cannot import runtime server dependencies')
        return
      }
      if (reExport && !serverFile) {
        report(node, source, 'server dependencies must not be re-exported as a public runtime API')
        return
      }
      if (node.type === 'ImportDeclaration') {
        if (serverFile) return
        const references = context.sourceCode
          .getDeclaredVariables(node)
          .filter((variable) => !renderer || variable.name === renderer.local.name)
          .flatMap((variable) =>
            variable.references.filter((reference) => runtimeIdentifiers.has(reference.identifier.range[0])),
          )
        if (references.length && references.every((reference) => serverPosition(reference.identifier.range[0], true)))
          return
      } else if (serverPosition(node.start)) return
      report(
        node,
        source,
        'use an inline imported TanStack server boundary; static isomorphic server imports belong only to the configured RPC owner',
      )
    }
    function global(node: Extract<ESTree.Node, { type: 'Identifier' }>) {
      const serverNames = ['process', 'Bun', 'Deno', 'Buffer', '__dirname', '__filename', 'require']
      const browserNames = [
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
      const member =
        node.parent.type === 'MemberExpression' && node.parent.object === node && node.name === 'globalThis'
          ? node.parent
          : undefined
      const name =
        member && !member.computed && member.property.type === 'Identifier'
          ? member.property.name
          : member?.computed && member.property.type === 'Literal' && typeof member.property.value === 'string'
            ? member.property.value
            : node.name
      if (!serverNames.includes(name) && !browserNames.includes(name)) return
      let scope: Scope | null = context.sourceCode.getScope(node)
      while (scope) {
        const variable = scope.set.get(node.name)
        if (variable?.defs.length) return
        scope = scope.upper
      }
      const references = context.sourceCode.getScope(node).references
      if (
        !references.some(
          (reference) =>
            reference.identifier.range[0] === node.start && runtimeIdentifiers.has(reference.identifier.range[0]),
        )
      )
        return
      if (serverNames.includes(name) && (shared || !serverPosition(node.start)))
        report(node, name, 'server globals require a server execution boundary')
      if (browserNames.includes(name) && (serverFile || rscFile) && boundary(node.start)?.side !== 'client')
        report(node, name, 'browser globals are unavailable during server execution')
    }
    return {
      Program(program) {
        options = optionsFirst<ModuleRuntimeOptions>(context)
        file = context.filename.replaceAll('\\', '/')
        serverFile = /\.server\.[cm]?[jt]sx?$/.test(file)
        rscFile = /\.rsc\.[cm]?[jt]sx?$/.test(file)
        shared =
          /\.(?:utils|constants)\.[cm]?[jt]sx?$/.test(file) ||
          options.web.some((path) => file.startsWith(path + '/lib/'))
        runtimeIdentifiers.clear()
        imports.clear()
        boundaries.length = 0
        for (const statement of program.body) {
          if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue
          if (/^(?:react|@tanstack\/react-(?:query|router))$/.test(statement.source.value)) {
            for (const specifier of statement.specifiers) {
              if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier')
                imports.set(specifier.local.name, { node: specifier.local, name: 'client-hooks' })
            }
          }
          if (['@tanstack/react-start/rsc', '@tanstack/react-start-rsc'].includes(statement.source.value)) {
            for (const specifier of statement.specifiers) {
              if (specifier.type === 'ImportNamespaceSpecifier')
                imports.set(specifier.local.name, { node: specifier.local, name: 'rsc-renderers' })
            }
          }
          if (statement.source.value !== '@tanstack/react-start') continue
          for (const specifier of statement.specifiers) {
            if (specifier.type === 'ImportSpecifier' && specifier.importKind !== 'type')
              imports.set(specifier.local.name, {
                node: specifier.local,
                name: specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value,
              })
            if (specifier.type === 'ImportNamespaceSpecifier')
              imports.set(specifier.local.name, { node: specifier.local, name: '*' })
          }
        }
        astVisit(program, [], (node, ancestors) => {
          if (
            node.type === 'Identifier' &&
            !ancestors.some(
              (ancestor) =>
                ancestor.type.startsWith('TS') &&
                ![
                  'TSAsExpression',
                  'TSSatisfiesExpression',
                  'TSNonNullExpression',
                  'TSInstantiationExpression',
                ].includes(ancestor.type),
            )
          )
            runtimeIdentifiers.add(node.start)
          if (node.type !== 'CallExpression') return
          const kind = factory(node.callee)
          const method =
            node.callee.type === 'MemberExpression' &&
            !node.callee.computed &&
            node.callee.property.type === 'Identifier'
              ? node.callee.property.name
              : undefined
          const side =
            kind === 'createServerOnlyFn' ||
            (kind === 'createServerFn' && method === 'handler') ||
            (['createIsomorphicFn', 'createMiddleware'].includes(kind ?? '') && method === 'server')
              ? 'server'
              : kind === 'createClientOnlyFn' ||
                  (['createIsomorphicFn', 'createMiddleware'].includes(kind ?? '') && method === 'client')
                ? 'client'
                : undefined
          const callback = node.arguments[0]
          if (
            kind &&
            side &&
            callback &&
            (callback.type === 'FunctionExpression' || callback.type === 'ArrowFunctionExpression')
          )
            boundaries.push({ start: callback.start, end: callback.end, side, kind })
        })
      },
      ImportDeclaration(node) {
        const typeOnly =
          node.importKind === 'type' ||
          (node.specifiers.length > 0 &&
            node.specifiers.every(
              (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
            ))
        check(node, node.source.value, typeOnly)
        if (!typeOnly && ['@tanstack/react-start/rsc', '@tanstack/react-start-rsc'].includes(node.source.value)) {
          for (const specifier of node.specifiers) {
            if (
              specifier.type === 'ImportSpecifier' &&
              specifier.importKind !== 'type' &&
              specifier.imported.type === 'Identifier' &&
              ['renderServerComponent', 'renderToReadableStream'].includes(specifier.imported.name)
            )
              check(node, node.source.value, false, false, specifier)
          }
        }
        if (
          !typeOnly &&
          (serverFile || rscFile) &&
          /^(?:react|@tanstack\/react-(?:query|router))$/.test(node.source.value)
        ) {
          for (const specifier of node.specifiers) {
            if (
              specifier.type !== 'ImportSpecifier' ||
              specifier.importKind === 'type' ||
              specifier.imported.type !== 'Identifier'
            )
              continue
            if (/^use[A-Z]/.test(specifier.imported.name) && specifier.imported.name !== 'useId') {
              const references = context.sourceCode
                .getDeclaredVariables(node)
                .filter((variable) => variable.name === specifier.local.name)
                .flatMap((variable) =>
                  variable.references.filter((reference) => runtimeIdentifiers.has(reference.identifier.range[0])),
                )
              if (
                !references.length ||
                !references.every((reference) => boundary(reference.identifier.range[0])?.side === 'client')
              )
                report(specifier, specifier.imported.name, 'client hooks do not belong in server/RSC services')
            }
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source)
          check(
            node,
            node.source.value,
            node.exportKind === 'type' ||
              (node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.exportKind === 'type')),
            true,
          )
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value, node.exportKind === 'type', true)
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal' && typeof node.source.value === 'string')
          check(node, node.source.value, false)
        else if (!options.allowComputedImportsIn?.includes(file)) context.report({ node, messageId: 'computed' })
      },
      MemberExpression(node) {
        const name =
          !node.computed && node.property.type === 'Identifier'
            ? node.property.name
            : node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string'
              ? node.property.value
              : undefined
        if (
          name &&
          ['renderServerComponent', 'renderToReadableStream'].includes(name) &&
          node.object.type === 'Identifier' &&
          imported(node.object) === 'rsc-renderers' &&
          (shared || !serverPosition(node.start, true))
        )
          report(node, name, 'server renderers require a server execution boundary')
        if (
          (serverFile || rscFile) &&
          name &&
          /^use[A-Z]/.test(name) &&
          name !== 'useId' &&
          node.object.type === 'Identifier' &&
          imported(node.object) === 'client-hooks' &&
          boundary(node.start)?.side !== 'client'
        )
          report(node, name, 'client hooks do not belong in server/RSC services')
      },
      Identifier: global,
    }
  },
})
