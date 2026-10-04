import { resolve, dirname } from 'node:path'
import type { ModuleBoundaryOptions } from '../../types/module-policy.types.ts'

/** Resolve literal module paths with the configured aliases and owning app root. */
export function boundaryResolveTarget(
  options: Pick<ModuleBoundaryOptions, 'web' | 'backend' | 'aliases'>,
  file: string,
  source: string,
): string {
  const owner = [...options.web, ...options.backend]
    .sort((a, b) => b.length - a.length)
    .find((root) => file.startsWith(root + '/'))
  const web = owner && options.web.includes(owner) ? owner : undefined
  const alias = Object.entries(options.aliases)
    .sort(([a], [b]) => b.length - a.length)
    .find(([prefix]) => source === prefix || source.startsWith(`${prefix}/`))
  return alias
    ? resolve(alias[1], source.slice(alias[0].length).replace(/^\//, '')).replaceAll('\\', '/')
    : source.startsWith('.')
      ? resolve(dirname(file), source).replaceAll('\\', '/')
      : source.startsWith('@/') && web
        ? `${web}/${source.slice(2)}`
        : source.startsWith('#/') && owner
          ? `${owner}/${source.slice(2)}`
          : source.startsWith('#services/') && owner
            ? `${owner}/services/${source.slice(10)}`
            : source
}
