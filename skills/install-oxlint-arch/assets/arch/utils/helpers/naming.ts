export function namingPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

export function namingFileBasename(filePath: string): string {
  const normalized = namingPosixPath(filePath)
  const slash = normalized.lastIndexOf('/')
  return slash === -1 ? normalized : normalized.slice(slash + 1)
}

export function namingDirSegments(filePath: string): string[] {
  const parts = namingPosixPath(filePath).split('/').filter(Boolean)
  return parts.slice(0, -1)
}

export function namingSegmentsAfter(filePath: string, after: string): string[] | undefined {
  const dirs = namingDirSegments(filePath)
  const marker = after.split('/').filter(Boolean)

  if (marker.length === 0) {
    return undefined
  }

  for (let index = dirs.length - marker.length; index >= 0; index -= 1) {
    if (marker.every((part, offset) => dirs[index + offset] === part)) {
      return dirs.slice(index + marker.length)
    }
  }
}

export function namingFolderPrefixes(
  folders: string[],
  separator: string,
  singularize: 'none' | 'trailing-s',
): string[] {
  const joined = folders.join(separator)
  const last = folders.at(-1) ?? ''
  const prefixes = [joined]

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
  const next = namingPascalCase(value)
  return `${next.charAt(0).toLowerCase()}${next.slice(1)}`
}

export function namingMatchTemplate(
  basename: string,
  template: string,
  placeholderPattern = '[a-z0-9-]+',
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

      const key = template.slice(index + 1, end)
      pattern += `(?<${key}>${placeholderPattern})`
      index = end + 1
      continue
    }

    pattern += /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char
    index += 1
  }

  return new RegExp(`^${pattern}$`).exec(basename)?.groups ?? null
}

export const namingStemModes = ['before-first-dot', 'full-basename'] as const
export type NamingStemMode = (typeof namingStemModes)[number]

export function namingNormalized(value: string, normalize: 'remove-separators' | 'none'): string {
  return normalize === 'none' ? value : value.replaceAll(/[-_]/g, '').toLowerCase()
}

export function namingFileStem(
  basename: string,
  mode: NamingStemMode = 'before-first-dot',
  trailingRoles: readonly string[] = [],
  roleSeparators: readonly string[] = ['.', '-'],
): string {
  const stem = mode === 'full-basename' ? basename : (basename.split('.')[0] ?? '')
  const roles = [...new Set(trailingRoles.filter(Boolean))].sort((left, right) => right.length - left.length)
  const separators = [...new Set(roleSeparators.filter(Boolean))]

  if (roles.length === 0 || separators.length === 0) {
    return stem
  }

  let remaining = stem
  let changed = true

  while (changed) {
    changed = false

    for (const role of roles) {
      for (const separator of separators) {
        const suffix = `${separator}${role}`

        if (remaining.length > suffix.length && remaining.endsWith(suffix)) {
          remaining = remaining.slice(0, -suffix.length)
          changed = true
          break
        }
      }

      if (changed) {
        break
      }
    }
  }

  return remaining
}

export function namingFilePrefixes(
  stem: string,
  normalize: 'remove-separators' | 'none' = 'remove-separators',
  singularize: 'none' | 'trailing-s' = 'none',
): string[] {
  const prefixes = [namingNormalized(stem, normalize)]
  const parts = stem.split(/[-_]+/).filter(Boolean)
  const last = parts.at(-1) ?? ''

  if (singularize === 'trailing-s' && last.endsWith('s') && last.length > 1) {
    prefixes.push(namingNormalized([...parts.slice(0, -1), last.slice(0, -1)].join('-'), normalize))
  }

  return [...new Set(prefixes.filter(Boolean))]
}

