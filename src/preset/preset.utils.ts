import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { presetExtensions, presetGeneratedFiles } from './preset.constants.ts'
import type { PresetManifest, PresetRules } from '../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export class PresetError extends Error {}

function presetIsOff(value: PresetRules[string] | undefined): boolean {
  const current = Array.isArray(value) ? value[0] : value
  return current === 'off' || current === 'allow' || current === 0
}

export function presetScopes(roots: string[], suffix = `**/${presetExtensions}`): string[] {
  return roots.map((root) => (root === '.' ? suffix : `${root}/${suffix}`))
}

export function presetOverride(files: string[], rules: PresetRules, excludeFiles: string[] = []): OxlintOverride {
  return {
    files,
    excludeFiles: [...presetGeneratedFiles, ...excludeFiles],
    rules,
  }
}

export function presetSeverity(rules: PresetRules, level: 'error' | 'warn'): PresetRules {
  const result = structuredClone(rules)

  for (const [name, value] of Object.entries(result)) {
    if (presetIsOff(value)) {
      continue
    }
    result[name] = Array.isArray(value) ? [level, ...value.slice(1)] : level
  }

  return result
}

export function presetRuleSeverities(
  rules: PresetRules,
  severities: Record<string, 'error' | 'warn' | 'off'>,
): PresetRules {
  const result = structuredClone(rules)

  for (const [name, level] of Object.entries(severities)) {
    const value = result[name]

    if (value === undefined || presetIsOff(value)) {
      continue
    }
    result[name] = Array.isArray(value) && level !== 'off' ? [level, ...value.slice(1)] : level
  }

  return result
}

export function presetPackageName(root: string, directory: string): string | undefined {
  try {
    const manifest: PresetManifest = JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'))
    return typeof manifest.name === 'string' ? manifest.name : undefined
  } catch {
    return undefined
  }
}

export function presetTsconfigAliasTargets(root: string, directory: string, specifier: string): string[] {
  let text: string

  try {
    text = readFileSync(resolve(root, directory, 'tsconfig.json'), 'utf8')
  } catch {
    return []
  }

  let output = ''

  for (let index = 0; index < text.length; index++) {
    const character = text[index]

    if (character === '"') {
      const end = /"(?:[^"\\]|\\.)*"/y
      end.lastIndex = index
      const literal = end.exec(text)?.[0] ?? text.slice(index)
      output += literal
      index += literal.length - 1
    } else if (character === '/' && text[index + 1] === '/') {
      const newline = text.indexOf('\n', index)
      index = newline === -1 ? text.length : newline - 1
    } else if (character === '/' && text[index + 1] === '*') {
      const close = text.indexOf('*/', index + 2)
      index = close === -1 ? text.length : close + 1
    } else if (character === '}' || character === ']') {
      output = output.replace(/,\s*$/, '') + character
    } else {
      output += character
    }
  }

  let config

  try {
    config = JSON.parse(output)
  } catch {
    return []
  }

  if (!config || typeof config !== 'object' || !('compilerOptions' in config)) {
    return []
  }

  const { compilerOptions } = config

  if (!compilerOptions || typeof compilerOptions !== 'object' || !('paths' in compilerOptions)) {
    return []
  }

  const { paths } = compilerOptions
  const baseUrl = typeof compilerOptions.baseUrl === 'string' ? compilerOptions.baseUrl : '.'

  if (!paths || typeof paths !== 'object') {
    return []
  }

  return Object.entries(paths).flatMap(([pattern, targets]) => {
    const [prefix, suffix = ''] = pattern.split('*')
    const wildcard = pattern.includes('*')

    const matches = wildcard
      ? specifier.startsWith(prefix) && specifier.endsWith(suffix) && specifier.length >= prefix.length + suffix.length
      : specifier === pattern

    if (!matches || !Array.isArray(targets)) {
      return []
    }

    const captured = wildcard ? specifier.slice(prefix.length, specifier.length - suffix.length) : ''
    return targets
      .flatMap((target) => (typeof target === 'string' ? [target.replace('*', captured)] : []))
      .map((target) => relative(root, resolve(root, directory, baseUrl, target)).replaceAll('\\', '/'))
      .filter((target) => target && !target.startsWith('..') && existsSync(resolve(root, target)))
  })
}
