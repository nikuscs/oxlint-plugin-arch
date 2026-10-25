import { posix } from 'node:path'
import type { NamingExportsStem, NamingStemMode } from '../types/naming.types.ts'
import type { OptionsSchemaProperties } from '../types/options.types.ts'

export const namingStemModes: readonly NamingStemMode[] = ['before-first-dot', 'full-basename']

export const namingStemSchemaProperties: OptionsSchemaProperties = {
  stem: { type: 'string', enum: [...namingStemModes] },
  roles: { type: 'array', items: { type: 'string' } },
  separators: { type: 'array', items: { type: 'string' } },
  normalize: { type: 'string', enum: ['remove-separators', 'none'] },
  singularize: { type: 'string', enum: ['none', 'trailing-s'] },
}

export function namingBasename(filePath: string): string {
  return posix.basename(filePath.replaceAll('\\', '/'))
}

export function namingPascalCase(value: string): string {
  return value
    .split(/[-_\s.]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}

export function namingCamelCase(value: string): string {
  const pascal = namingPascalCase(value)
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`
}

export function namingNormalized(value: string, normalize: 'remove-separators' | 'none'): string {
  return normalize === 'none' ? value : value.replaceAll(/[-_.]/g, '').toLowerCase()
}

function namingTrailingSuffix(value: string, suffixes: string[]): string | undefined {
  return suffixes.find((item) => value.length > item.length && value.endsWith(item))
}

export function namingFileStem(
  basename: string,
  mode: NamingStemMode = 'before-first-dot',
  trailingRoles: readonly string[] = [],
  roleSeparators: readonly string[] = ['.', '-'],
): string {
  let stem = mode === 'full-basename' ? basename : (basename.split('.')[0] ?? '')
  const roles = [...new Set(trailingRoles.filter(Boolean))].sort((left, right) => right.length - left.length)

  const suffixes = roles.flatMap((role) =>
    [...new Set(roleSeparators.filter(Boolean))].map((separator) => `${separator}${role}`),
  )

  for (let suffix = namingTrailingSuffix(stem, suffixes); suffix; suffix = namingTrailingSuffix(stem, suffixes)) {
    stem = stem.slice(0, -suffix.length)
  }

  return stem
}

export function namingFilePrefixesFor(filename: string, options: NamingExportsStem): string[] {
  const basename = namingBasename(filename).replace(/\.(tsx?|jsx?)$/, '')
  const stem = namingFileStem(basename, options.stem, options.roles, options.separators)
  const normalize = options.normalize ?? 'remove-separators'
  const prefixes = [namingNormalized(stem, normalize)]
  const parts = stem.split(/[-_]+/).filter(Boolean)
  const last = parts.at(-1) ?? ''

  if (options.singularize === 'trailing-s' && last.endsWith('s') && last.length > 1) {
    prefixes.push(namingNormalized([...parts.slice(0, -1), last.slice(0, -1)].join('-'), normalize))
  }

  return [...new Set(prefixes.filter(Boolean))]
}

export function namingHasFilePrefix(name: string, prefixes: readonly string[], normalize: NamingExportsStem['normalize']): boolean {
  const comparable = normalize === 'none' ? name : name.replaceAll('_', '').toLowerCase()
  return prefixes.some((prefix) => comparable.startsWith(prefix))
}
