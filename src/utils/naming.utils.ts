import { posix } from 'node:path'
import type { NamingExportPrefixOptions, NamingStemMode } from '../types/naming.types.ts'

export const namingStemModes: readonly NamingStemMode[] = ['before-first-dot', 'full-basename']

export const namingStemSchemaProperties = {
  stem: { type: 'string', enum: [...namingStemModes] },
  trailingRoles: { type: 'array', items: { type: 'string' } },
  roleSeparators: { type: 'array', items: { type: 'string' } },
  normalize: { type: 'string', enum: ['remove-separators', 'none'] },
  singularize: { type: 'string', enum: ['none', 'trailing-s'] },
}

function namingPosix(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

export function namingBasename(filePath: string): string {
  return posix.basename(namingPosix(filePath))
}

export function namingFolders(filePath: string): string[] {
  return posix
    .dirname(namingPosix(filePath))
    .split('/')
    .filter((part) => part && part !== '.')
}

export function namingFoldersAfter(filePath: string, after: string): string[] | undefined {
  const folders = namingFolders(filePath)
  const marker = after.split('/').filter(Boolean)

  if (marker.length === 0) {
    return undefined
  }

  for (let index = folders.length - marker.length; index >= 0; index -= 1) {
    if (marker.every((part, offset) => folders[index + offset] === part)) {
      return folders.slice(index + marker.length)
    }
  }

  return undefined
}

export function namingFolderPrefixes(
  folders: string[],
  separator: string,
  singularize: 'none' | 'trailing-s',
): string[] {
  const last = folders.at(-1) ?? ''
  const prefixes = [folders.join(separator)]

  if (singularize === 'trailing-s' && last.endsWith('s') && last.length > 1) {
    prefixes.push([...folders.slice(0, -1), last.slice(0, -1)].join(separator))
  }

  return prefixes.filter(Boolean)
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

export function namingComponentName(basename: string): string {
  return namingPascalCase(basename.replace(/\.(tsx?|jsx?)$/, ''))
}

export function namingMatchTemplate(
  basename: string,
  template: string,
  placeholder = '[a-z0-9-]+',
): Record<string, string> | null {
  let pattern = ''
  let index = 0

  while (index < template.length) {
    const char = template[index]

    if (char === '{') {
      const end = template.indexOf('}', index)

      if (end === -1) {
        return null
      }
      pattern += `(?<${template.slice(index + 1, end)}>${placeholder})`
      index = end + 1
      continue
    }
    pattern += /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char
    index += 1
  }

  return new RegExp(`^${pattern}$`).exec(basename)?.groups ?? null
}

export function namingExpandTemplate(template: string, groups: Record<string, string>, camelCase = false): string {
  return template.replaceAll(/\{([^}]+)\}/g, (placeholder, key: string) => {
    const group = groups[key.toLowerCase()]

    if (!group) {
      return placeholder
    }

    if (/^[A-Z]/.test(key)) {
      return namingPascalCase(group)
    }

    return camelCase ? namingCamelCase(group) : group
  })
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

export function namingFilePrefixesFor(filename: string, options: Pick<NamingExportPrefixOptions, 'stem' | 'trailingRoles' | 'roleSeparators' | 'normalize' | 'singularize'>): string[] {
  const basename = namingBasename(filename).replace(/\.(tsx?|jsx?)$/, '')
  const stem = namingFileStem(basename, options.stem, options.trailingRoles, options.roleSeparators)
  const normalize = options.normalize ?? 'remove-separators'
  const prefixes = [namingNormalized(stem, normalize)]
  const parts = stem.split(/[-_]+/).filter(Boolean)
  const last = parts.at(-1) ?? ''

  if (options.singularize === 'trailing-s' && last.endsWith('s') && last.length > 1) {
    prefixes.push(namingNormalized([...parts.slice(0, -1), last.slice(0, -1)].join('-'), normalize))
  }

  return [...new Set(prefixes.filter(Boolean))]
}

export function namingHasFilePrefix(name: string, prefixes: readonly string[], normalize: NamingExportPrefixOptions['normalize']): boolean {
  const comparable = normalize === 'none' ? name : name.replaceAll('_', '').toLowerCase()
  return prefixes.some((prefix) => comparable.startsWith(prefix))
}
