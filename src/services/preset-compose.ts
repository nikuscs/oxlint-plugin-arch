import type { OxlintConfig, OxlintOverride } from 'oxlint'
import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetCommonRules, presetPolicyOrder } from '../constants/preset.constants.ts'
import { presetOverride, presetRuleSeverities, presetScopes, presetSeverity } from '../utils/helpers/preset.ts'

export function presetCompose(context: PresetContext, policies: PresetPolicies, plugins: OxlintConfig): OxlintConfig {
  const { options, level, app, safetyFiles, ui, generated } = context
  const severities = options.ruleSeverities ?? {}
  const levels = (rules: NonNullable<OxlintOverride['rules']>) =>
    presetRuleSeverities(presetSeverity(rules, level), severities)
  const maxLines = (max: number) => levels({ 'max-lines': ['error', { max, skipBlankLines: true, skipComments: true }] })
  const overrideList: OxlintOverride[] = []
  for (const name of presetPolicyOrder) {
    const setting = options.policies?.[name]
    if (setting === false || !policies[name]) {
      continue
    }
    const defaults = structuredClone(policies[name])
    const entries = typeof setting === 'function' ? setting(defaults) : defaults
    for (const entry of entries) {
      overrideList.push({
        ...entry,
        rules: entry.rules ? levels(entry.rules) : undefined,
      })
    }
  }
  overrideList.push(
    presetOverride(
      safetyFiles,
      levels({
        ...maxLines(options.limits?.maxFileLines ?? 400),
        complexity: ['error', { max: options.limits?.maxFunctionComplexity ?? 32 }],
      }),
      ui,
    ),
    presetOverride(presetScopes(app, '**/*.types.ts'), maxLines(options.limits?.maxTypeFileLines ?? 1000), ui),
  )
  // Rules the preset never names, such as those from the correctness category, get their level at the top.
  const named = new Set([...Object.keys(presetCommonRules), ...overrideList.flatMap((entry) => Object.keys(entry.rules ?? {}))])
  const unnamedLevels = Object.fromEntries(Object.entries(severities).filter(([rule]) => !named.has(rule)))
  for (const [rule, files] of Object.entries(options.ruleExclusions ?? {})) {
    overrideList.push({ files, rules: { [rule]: 'off' } })
  }
  return {
    options: { typeAware: true },
    categories: { correctness: level },
    plugins: ['typescript', 'react', 'react-perf', 'jsx-a11y', 'import', 'unicorn', 'promise', 'vitest', 'node', 'oxc'],
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.output/**',
      ...(context.nextWeb.length ? ['**/.next/**', '**/next-env.d.ts'] : []),
      ...generated,
      ...(options.ignorePatterns ?? []),
    ],
    ...plugins,
    rules: { ...levels(presetCommonRules), ...unnamedLevels },
    overrides: overrideList.filter((entry) => entry.files.length > 0),
  }
}
