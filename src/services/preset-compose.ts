import type { OxlintConfig, OxlintOverride } from 'oxlint'
import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import {
  presetCommonRules,
  presetPolicyOrder,
} from '../constants/preset.constants.ts'
import { presetOverride, presetSeverity } from '../utils/helpers/preset.ts'

export function presetCompose(
  context: PresetContext,
  policies: PresetPolicies,
  plugins: OxlintConfig,
): OxlintConfig {
  const { options, level, safetyFiles, ui, generated } = context
  const overrideList: OxlintOverride[] = []
  for (const name of presetPolicyOrder) {
    const setting = options[name]
    if (setting === false || !policies[name]) {
      continue
    }
    const defaults = structuredClone(policies[name])
    const entries = typeof setting === 'function' ? setting(defaults) : defaults
    for (const entry of entries) {
      overrideList.push({
        ...entry,
        rules: entry.rules ? presetSeverity(entry.rules, level) : undefined,
      })
    }
  }
  overrideList.push(
    presetOverride(
      safetyFiles,
      {
        'max-lines': [
          level,
          { max: options.maxLines ?? 400, skipBlankLines: true, skipComments: true },
        ],
        complexity: [level, { max: options.complexity ?? 32 }],
      },
      ui,
    ),
  )
  for (const [rule, files] of Object.entries(options.exclude ?? {})) {
    overrideList.push({ files, rules: { [rule]: 'off' } })
  }
  return {
    options: { typeAware: true },
    categories: { correctness: level },
    plugins: [
      'typescript',
      'react',
      'react-perf',
      'jsx-a11y',
      'import',
      'unicorn',
      'promise',
      'vitest',
      'node',
      'oxc',
    ],
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.output/**',
      ...generated,
      ...(options.ignorePatterns ?? []),
    ],
    ...plugins,
    rules: presetSeverity(presetCommonRules, level),
    overrides: overrideList.filter((entry) => entry.files.length > 0),
  }
}
