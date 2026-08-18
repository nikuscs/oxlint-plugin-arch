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
