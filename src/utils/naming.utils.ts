import { readdirSync } from 'node:fs'
import { dirname, posix } from 'node:path'
import { optionsGlob } from './options.utils.ts'
import type { NamingCaptureOptions, NamingExportsStem, NamingStemMode } from '../types/naming.types.ts'
import type { OptionsPattern, OptionsSchemaProperties } from '../types/options.types.ts'

export const namingStemModes: readonly NamingStemMode[] = ['before-first-dot', 'full-basename']

export const namingStemSchemaProperties: OptionsSchemaProperties = {
  stem: { type: 'string', enum: [...namingStemModes] },
  roles: { type: 'array', items: { type: 'string' } },
  separators: { type: 'array', items: { type: 'string' } },
  normalize: { type: 'string', enum: ['remove-separators', 'none'] },
  singularize: { type: 'string', enum: ['none', 'trailing-s'] },
  prefix: { type: 'array', items: { type: 'string', enum: ['file', 'folder', 'parent'] }, minItems: 1 },
}

export const namingCaptureSchemaProperties: OptionsSchemaProperties = {
  file: { type: 'string' },
  placeholder: { type: 'string' },
  stem: { type: 'string', enum: [...namingStemModes, 'folder'] },
  singularize: { type: 'string', enum: ['none', 'trailing-s'] },
  roles: { type: 'array', items: { type: 'string' } },
  separators: { type: 'array', items: { type: 'string' } },
}

export function namingBasename(filePath: string): string {
  return posix.basename(filePath.replaceAll('\\', '/'))
}

export function namingPascalCase(value: string): string {
  return value
    .split(/[-_\s.{}/]+/)
    .map((part) => part.replaceAll(/^[$@()[\]{}]+|[$@()[\]{}]+$/g, ''))
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

function namingSingular(value: string): string {
  const parts = value.split(/[-_]+/).filter(Boolean)
  const last = parts.at(-1) ?? ''

  return last.endsWith('s') && last.length > 1 ? [...parts.slice(0, -1), last.slice(0, -1)].join('-') : value
}

function namingFolders(filename: string): string[] {
  return filename.replaceAll('\\', '/').split('/').slice(0, -1).toReversed()
}

export function namingFilePrefixesFor(filename: string, options: NamingExportsStem): string[] {
  const basename = namingBasename(filename).replace(/\.(tsx?|jsx?)$/, '')
  const [folder = '', parent = ''] = namingFolders(filename)
  const normalize = options.normalize ?? 'remove-separators'
  const sources = { file: namingFileStem(basename, options.stem, options.roles, options.separators), folder, parent }

  const prefixes = (options.prefix ?? ['file']).flatMap((source) => {
    const stem = sources[source]

    return options.singularize === 'trailing-s' ? [stem, namingSingular(stem)] : [stem]
  })

  return [...new Set(prefixes.map((stem) => namingNormalized(stem, normalize)).filter(Boolean))]
}

export function namingTemplatePattern(template: string, placeholder = '[a-z0-9-]+'): RegExp | null {
  const seen = new Set<string>()

  const source = template
    .split(/(\{[^{}]+\})/)
    .map((part) => {
      const name = /^\{[^{}]+\}$/.test(part) ? part.slice(1, -1) : undefined

      if (name === undefined) {
        return part
          .replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replaceAll('\\*\\*/', '(?:.*/)?')
          .replaceAll('\\*\\*', '.*')
      }

      const again = seen.has(name)

      seen.add(name)

      return again ? `\\k<${name}>` : `(?<${name}>${placeholder})`
    })
    .join('')

  try {
    return new RegExp(`^${source}$`)
  } catch {
    return null
  }
}

export function namingCaptures(filename: string, options: NamingCaptureOptions = {}): Record<string, string> | null {
  const path = filename.replaceAll('\\', '/')
  const file = namingBasename(path).replace(/\.(tsx?|jsx?)$/, '')
  const [folder = '', parent = ''] = namingFolders(path)
  const stem = namingFileStem(file, options.stem === 'folder' ? undefined : options.stem, options.roles, options.separators)
  const read = options.stem === 'folder' ? folder : stem
  const last = read.split(/[-_]+/).at(-1) ?? ''
  const domain = options.singularize === 'trailing-s' && last.length > 1 && last.endsWith('s') ? read.slice(0, -1) : read
  const builtIn = { file, stem, folder, parent, domain }

  if (options.file === undefined) {
    return builtIn
  }

  const deep = options.file.includes('**')
  const depth = options.file.split('/').length
  const match = namingTemplatePattern(deep ? `**/${options.file}` : options.file, options.placeholder)?.exec(deep ? path : path.split('/').slice(-depth).join('/'))

  return match ? { ...builtIn, ...match.groups } : null
}

export function namingExpand(
  template: string,
  captures: Record<string, string>,
  camelCase: boolean,
  escape: (value: string) => string = (value) => value,
): string {
  return template.replaceAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (placeholder, key: string) => {
    const name = key.toLowerCase()

    if (!Object.hasOwn(captures, name)) {
      return placeholder
    }

    const value = captures[name]

    if (key.length > 1 && key === key.toUpperCase()) {
      return escape(value.split(/[-_\s.]+/).filter(Boolean).join('_').toUpperCase())
    }

    if (/^[A-Z]/.test(key)) {
      return escape(namingPascalCase(value))
    }

    return escape(camelCase ? namingCamelCase(value) : value)
  })
}

export function namingSiblings(filename: string, globs: OptionsPattern | undefined, captures: Record<string, string>): boolean {
  const entries = globs === undefined ? [] : [globs].flat()

  if (entries.length === 0) {
    return true
  }

  let names: string[]

  try {
    names = readdirSync(dirname(filename))
  } catch {
    return false
  }

  const namingSibling = (glob: string) => {
    const pattern = optionsGlob(namingExpand(glob, captures, false))

    return names.some((name) => pattern.test(name))
  }

  const present = entries.filter((glob) => !glob.startsWith('!'))

  return entries.every((glob) => !glob.startsWith('!') || !namingSibling(glob.slice(1))) && (present.length === 0 || present.some(namingSibling))
}

export function namingKeyPath(captures: Record<string, string>, keys: readonly string[], key = keys.at(-1) ?? '') {
  return { ...captures, path: keys.join('-'), key }
}

export function namingHasFilePrefix(name: string, prefixes: readonly string[], normalize: NamingExportsStem['normalize']): boolean {
  const comparable = normalize === 'none' ? name : name.replaceAll('_', '').toLowerCase()
  return prefixes.some((prefix) => comparable.startsWith(prefix))
}
