import { builtinModules } from 'node:module'
import type { ESTree } from '@oxlint/plugins'
import type { ModuleBoundaryOptions } from '../../types/module-policy.types.ts'

/** Globals that only exist on the server runtime. */
export const runtimeServerGlobals = ['process', 'Bun', 'Deno', 'Buffer', '__dirname', '__filename', 'require']

/** Globals that only exist in the browser. */
export const runtimeBrowserGlobals = [
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

/** Whether `source` is one of the configured module prefixes or a subpath of one. */
export function runtimeMatchesImport(values: string[] | undefined, source: string): boolean {
  return Boolean(values?.some((value) => source === value || source.startsWith(value + '/')))
}

/** Whether an import reaches a configured backend root or a backend package's server/RPC entry. */
export function runtimeIsBackendImport(
  options: Pick<ModuleBoundaryOptions, 'backend' | 'backendPackages'>,
  target: string,
  source: string,
): boolean {
  return (
    options.backend.some((path) => target.startsWith(path + '/')) ||
    options.backendPackages.some(
      (name) =>
        source === name ||
        (source.startsWith(name + '/') && /\/(?:server|rpc)(?:\/|$)/.test(source.slice(name.length))),
    )
  )
}

/** Whether an import is a server platform module: Node built-ins, Bun, Cloudflare, oRPC server or React DOM server. */
export function runtimeIsServerPlatformImport(source: string): boolean {
  return (
    builtinModules.includes(source) ||
    source === '@orpc/server' ||
    /^(?:node:|bun(?::|$)|cloudflare:)/.test(source) ||
    /^react-dom\/server(?:\.|\/|$)/.test(source)
  )
}

/** The static name of a member access: `a.b` and `a['b']` give `b`; anything else gives `null`. */
export function runtimeMemberName(node: ESTree.Node | null | undefined): string | null {
  if (node?.type !== 'MemberExpression') return null
  if (!node.computed && node.property.type === 'Identifier') return node.property.name
  return node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string'
    ? node.property.value
    : null
}
