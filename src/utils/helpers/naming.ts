export function namingPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

export function namingFileBasename(filePath: string): string {
  const normalized = namingPosixPath(filePath)
  const slash = normalized.lastIndexOf('/')
  return slash === -1 ? normalized : normalized.slice(slash + 1)
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
