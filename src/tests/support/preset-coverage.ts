import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { tanstackStartReactModulesPreset } from '../../presets/index.ts'
import type { PresetEffectiveConfig } from '../types/preset-fixture.types.ts'

export function presetCoverageRule(name: string): string {
  return name
    .replace(/^([^()]+)\(([^)]+)\)$/, '$1/$2')
    .replace(/^jsx_a11y\//, 'jsx-a11y/')
    .replace(/^react_perf\//, 'react-perf/')
    .replace(/^react-hooks\//, 'react/')
    .replace(/^typescript\/(no-array-constructor|no-unused-expressions|no-useless-constructor|no-empty-function|default-param-last|no-loop-func|no-shadow)$/, 'eslint/$1')
    .replace(/^[^/]+$/, 'eslint/$&')
}

export function presetCoverageInventory(root: string): string[] {
  const result = spawnSync(process.execPath, [
    resolve(import.meta.dirname, '../../../node_modules/oxlint/bin/oxlint'),
    '-c', 'oxlint.config.ts', '--print-config',
  ], { cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 8 * 1024 * 1024 })

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(result.stderr + result.stdout)
  }

  const config: PresetEffectiveConfig = JSON.parse(result.stdout)
  const authored = tanstackStartReactModulesPreset({ root })
  const rules = new Set<string>()

  for (const scope of [config, ...config.overrides, authored, ...authored.overrides ?? []]) {
    for (const [name, setting] of Object.entries(scope.rules ?? {})) {
      const severity = Array.isArray(setting) ? setting[0] : setting

      if (severity !== undefined && !['off', 'allow', 0].includes(severity)) {
        rules.add(presetCoverageRule(name))
      }
    }
  }

  return [...rules].sort()
}

export function presetCoverageFiles(root: string): Set<string> {
  const result = spawnSync(process.execPath, [
    resolve(import.meta.dirname, '../../../node_modules/oxlint/bin/oxlint'),
    '-c', 'oxlint.config.ts', '--debug=files', 'apps', 'packages', 'scripts',
  ], { cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 8 * 1024 * 1024 })

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(result.stderr + result.stdout)
  }

  return new Set(result.stdout.trim().split('\n'))
}
