import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { OxlintOverride } from 'oxlint'
import type { PresetRules, PresetManifest } from '../../types/preset.types.ts'
import { presetExtensions, presetGeneratedFiles } from '../../constants/preset.constants.ts'

export function presetScopes(roots: string[], suffix = `**/${presetExtensions}`): string[] {
  return roots.map((root) => `${root}/${suffix}`)
}

export function presetOverride(files: string[], rules: PresetRules, excludeFiles: string[] = []): OxlintOverride {
  return {
    files,
    excludeFiles: [...presetGeneratedFiles, ...excludeFiles],
    rules,
  }
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
