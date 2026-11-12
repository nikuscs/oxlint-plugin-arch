import { builtinModules } from 'node:module'
import { dirname, resolve } from 'node:path'
import { optionsEscape } from './options.utils.ts'
import type { BoundariesOptions, BoundariesRuntimeConventions } from '../types/boundaries.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

const boundariesRuntimeConventions: Required<BoundariesRuntimeConventions> = {
  server: ['server'],
  rsc: ['rsc'],
  actions: ['action'],
  client: ['client'],
  clientOnly: ['client-only'],
  hooks: ['hooks'],
  shared: ['utils', 'constants'],
  lib: 'lib',
}

const boundariesSuffixList = { type: 'array', items: { type: 'string', minLength: 1 } }

export function boundariesConventionsFor(options: { conventions?: BoundariesRuntimeConventions }): Required<BoundariesRuntimeConventions> {
  return { ...boundariesRuntimeConventions, ...options.conventions }
}

export function boundariesHasSuffix(suffixes: readonly string[], path: string, optionalExtension = false): boolean {
  const extension = optionalExtension ? '(?:\\.[cm]?[jt]sx?)?' : '\\.[cm]?[jt]sx?'
  return suffixes.length > 0 && new RegExp(`\\.(?:${suffixes.map(optionsEscape).join('|')})${extension}$`).test(path)
}

export function boundariesIsClientOnly(conventions: Required<BoundariesRuntimeConventions>, target: string): boolean {
  return (
    conventions.hooks.some((folder) => target.includes(`/${folder}/`)) ||
    conventions.clientOnly.some((suffix) => new RegExp(`\\.${optionsEscape(suffix)}(?:\\.|$)`).test(target))
  )
}

export const boundariesServerGlobals = ['process', 'Bun', 'Deno', 'Buffer', '__dirname', '__filename', 'require']

export const boundariesBrowserGlobals = [
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

export const boundariesRuntimeProperties = {
  web: { type: 'array', items: { type: 'string' } },
  backend: { type: 'array', items: { type: 'string' } },
  aliases: { type: 'object', additionalProperties: { type: 'string' } },
  backendPackages: { type: 'array', items: { type: 'string' } },
  server: { type: 'array', items: { type: 'string' } },
  client: { type: 'array', items: { type: 'string' } },
  dynamic: { type: 'array', items: { type: 'string' } },
  serverPackages: { type: 'array', items: { type: 'string' } },
  clientPackages: { type: 'array', items: { type: 'string' } },
  hookPackages: { type: 'array', items: { type: 'string' } },
  conventions: {
    type: 'object',
    additionalProperties: false,
    properties: {
      server: boundariesSuffixList,
      rsc: boundariesSuffixList,
      actions: boundariesSuffixList,
      client: boundariesSuffixList,
      clientOnly: boundariesSuffixList,
      hooks: boundariesSuffixList,
      shared: boundariesSuffixList,
      lib: { type: 'string', minLength: 1 },
    },
  },
}

export const boundariesServerPackages = ['@orpc/server', 'react-dom/server']

export const boundariesRuntimeMessages = {
  runtime: '{{source}} is not valid here: {{reason}}.',
  computed: 'Use a literal dynamic import so runtime ownership can be checked, or list this exact file in the dynamic option after reviewing its targets.',
}

export function boundariesExportVisitors(
  check: (node: PluginsTypes.ESTree.Node, source: string, typeOnly: boolean, reExport: boolean) => void,
) {
  return {
    ExportNamedDeclaration(node: PluginsTypes.ESTree.ExportNamedDeclaration) {
      if (!node.source) {
        return
      }

      const typeOnly = node.exportKind === 'type' || (node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.exportKind === 'type'))

      check(node, node.source.value, typeOnly, true)
    },
    ExportAllDeclaration(node: PluginsTypes.ESTree.ExportAllDeclaration) {
      check(node, node.source.value, node.exportKind === 'type', true)
    },
  }
}

export function boundariesLiteralSource(node: PluginsTypes.ESTree.ImportExpression): string | undefined {
  return node.source.type === 'Literal' && typeof node.source.value === 'string' ? node.source.value : undefined
}

export function boundariesReport(context: PluginsTypes.Context, node: PluginsTypes.ESTree.Node, source: string, reason: string): void {
  context.report({
    node,
    messageId: 'runtime',
    data: { source, reason },
  })
}

export function boundariesRuntimeImportVisitors(
  context: PluginsTypes.Context,
  check: (node: PluginsTypes.ESTree.Node, source: string, typeOnly: boolean, reExport: boolean) => void,
  allowComputed: () => boolean,
) {
  return {
    ...boundariesExportVisitors(check),
    ImportExpression(node: PluginsTypes.ESTree.ImportExpression) {
      const source = boundariesLiteralSource(node)

      if (source !== undefined) {
        check(node, source, false, false)
      } else if (!allowComputed()) {
        context.report({ node, messageId: 'computed' })
      }
    },
  }
}

export function boundariesIsSharedFile(options: Pick<BoundariesOptions, 'web'>, conventions: Required<BoundariesRuntimeConventions>, file: string): boolean {
  return boundariesHasSuffix(conventions.shared, file) || options.web.some((path) => file.startsWith(`${path}/${conventions.lib}/`))
}

export function boundariesDeclaredVariable(start: PluginsTypes.Scope | null, name: string): PluginsTypes.Variable | null {
  for (let scope = start; scope; scope = scope.upper) {
    const variable = scope.set.get(name)

    if (variable?.defs.length) {
      return variable
    }
  }

  return null
}

export function boundariesMatchesImport(prefixes: string[] | undefined, source: string): boolean {
  return Boolean(prefixes?.some((prefix) => source === prefix || source.startsWith(`${prefix}/`)))
}

export function boundariesIsBackendImport(
  options: Pick<BoundariesOptions, 'backend' | 'backendPackages'>,
  target: string,
  source: string,
): boolean {
  return (
    options.backend.some((path) => target.startsWith(`${path}/`)) ||
    options.backendPackages.some(
      (name) =>
        source === name ||
        (source.startsWith(`${name}/`) && /\/(?:server|rpc)(?:\/|$)/.test(source.slice(name.length))),
    )
  )
}

export function boundariesIsServerPlatformImport(source: string, packages: readonly string[]): boolean {
  return (
    builtinModules.includes(source) ||
    /^(?:node:|bun(?::|$)|cloudflare:)/.test(source) ||
    packages.some((name) => source === name || source.startsWith(`${name}/`) || source.startsWith(`${name}.`))
  )
}

export function boundariesMemberName(node: PluginsTypes.ESTree.Node | null | undefined): string | null {
  if (node?.type !== 'MemberExpression') {
    return null
  }

  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }

  return node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string'
    ? node.property.value
    : null
}

export function boundariesResolveTarget(
  options: Pick<BoundariesOptions, 'web' | 'backend' | 'aliases'>,
  file: string,
  source: string,
  services = 'services',
): string {
  const owner = [...options.web, ...options.backend]
    .sort((a, b) => b.length - a.length)
    .find((root) => file.startsWith(`${root}/`))

  const web = owner && options.web.includes(owner) ? owner : undefined

  const alias = Object.entries(options.aliases)
    .sort(([a], [b]) => b.length - a.length)
    .find(([prefix]) => source === prefix || source.startsWith(`${prefix}/`))

  if (alias) {
    return resolve(alias[1], source.slice(alias[0].length).replace(/^\//, '')).replaceAll('\\', '/')
  }

  if (source.startsWith('.')) {
    return resolve(dirname(file), source).replaceAll('\\', '/')
  }

  if (source.startsWith('@/') && web) {
    return `${web}/${source.slice(2)}`
  }

  if (source.startsWith('#/') && owner) {
    return `${owner}/${source.slice(2)}`
  }

  if (source.startsWith('#services/') && owner) {
    return `${owner}/${services}/${source.slice('#services/'.length)}`
  }

  return source
}
