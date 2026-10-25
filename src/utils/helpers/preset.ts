import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import type { OxlintOverride } from 'oxlint'
import type { PresetRules, PresetManifest } from '../../types/preset.types.ts'
import { presetExtensions, presetGeneratedFiles } from '../../constants/preset.constants.ts'

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

export function presetRuleSeverities(
  rules: PresetRules,
  severities: Record<string, 'error' | 'warn' | 'off'>,
): PresetRules {
  const result = structuredClone(rules)

  for (const [name, level] of Object.entries(severities)) {
    const value = result[name]
    const current = Array.isArray(value) ? value[0] : value
    if (value === undefined || current === 'off' || current === 'allow' || current === 0) {
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

export function presetSeverity(rules: PresetRules, level: 'error' | 'warn'): PresetRules {
  const result = structuredClone(rules)

  for (const [name, value] of Object.entries(result)) {
    const current = Array.isArray(value) ? value[0] : value
    if (current === 'off' || current === 'allow' || current === 0) {
      continue
    }
    result[name] = Array.isArray(value) ? [level, ...value.slice(1)] : level
  }

  return result
}

function presetReadJsonc(path: string): unknown {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return undefined
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
      index = text.indexOf('\n', index) === -1 ? text.length : text.indexOf('\n', index) - 1
    } else if (character === '/' && text[index + 1] === '*') {
      index = text.indexOf('*/', index + 2) === -1 ? text.length : text.indexOf('*/', index + 2) + 1
    } else if (character === '}' || character === ']') {
      output = output.replace(/,\s*$/, '') + character
    } else {
      output += character
    }
  }
  try {
    return JSON.parse(output)
  } catch {
    return undefined
  }
}

/** Project-relative folders that `specifier` maps to through `<directory>/tsconfig.json` `compilerOptions.paths`. */
export function presetTsconfigAliasTargets(root: string, directory: string, specifier: string): string[] {
  const config = presetReadJsonc(resolve(root, directory, 'tsconfig.json'))
  if (!config || typeof config !== 'object' || !('compilerOptions' in config)) return []
  const { compilerOptions } = config
  if (!compilerOptions || typeof compilerOptions !== 'object' || !('paths' in compilerOptions)) return []
  const { paths } = compilerOptions
  const baseUrl = 'baseUrl' in compilerOptions && typeof compilerOptions.baseUrl === 'string' ? compilerOptions.baseUrl : '.'
  if (!paths || typeof paths !== 'object') return []
  return Object.entries(paths).flatMap(([pattern, targets]) => {
    const [prefix, suffix = ''] = pattern.split('*')
    const wildcard = pattern.includes('*')
    const matches = wildcard
      ? specifier.startsWith(prefix) && specifier.endsWith(suffix) && specifier.length >= prefix.length + suffix.length
      : specifier === pattern
    if (!matches || !Array.isArray(targets)) return []
    const captured = wildcard ? specifier.slice(prefix.length, specifier.length - suffix.length) : ''
    return targets
      .filter((target) => typeof target === 'string')
      .map((target) => relative(root, resolve(root, directory, baseUrl, target.replace('*', captured))).replaceAll('\\', '/'))
      .filter((target) => target && !target.startsWith('..') && existsSync(resolve(root, target)))
  })
}
