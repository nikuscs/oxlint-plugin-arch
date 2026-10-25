import { builtinModules } from 'node:module'
import { dirname, resolve } from 'node:path'
import type { BoundariesOptions } from '../types/boundaries.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

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
  serverImports: { type: 'array', items: { type: 'string' } },
  clientImports: { type: 'array', items: { type: 'string' } },
  allowComputedImportsIn: { type: 'array', items: { type: 'string' } },
}

export const boundariesRuntimeMessages = {
  runtime: '{{source}} is not valid here: {{reason}}.',
  computed: 'Use a literal dynamic import so runtime ownership can be checked, or declare this exact file in allowComputedImportsIn after reviewing its targets.',
}

export function boundariesIsTypeOnlyExport(node: PluginsTypes.ESTree.ExportNamedDeclaration): boolean {
  return node.exportKind === 'type' || (node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.exportKind === 'type'))
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

export function boundariesImportExpression(
  context: PluginsTypes.Context,
  node: PluginsTypes.ESTree.ImportExpression,
  allowComputed: boolean,
  check: (source: string) => void,
): void {
  const source = boundariesLiteralSource(node)

  if (source !== undefined) {
    check(source)
  } else if (!allowComputed) {
    context.report({ node, messageId: 'computed' })
  }
}

export function boundariesIsSharedFile(options: Pick<BoundariesOptions, 'web'>, file: string): boolean {
  return /\.(?:utils|constants)\.[cm]?[jt]sx?$/.test(file) || options.web.some((path) => file.startsWith(`${path}/lib/`))
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

export function boundariesIsServerPlatformImport(source: string): boolean {
  return (
    builtinModules.includes(source) ||
    source === '@orpc/server' ||
    /^(?:node:|bun(?::|$)|cloudflare:)/.test(source) ||
    /^react-dom\/server(?:\.|\/|$)/.test(source)
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
    return `${owner}/services/${source.slice(10)}`
  }

  return source
}
