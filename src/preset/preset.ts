import { presetBoundariesConfig } from './preset-boundaries.ts'
import { presetResolveContext } from './preset-context.ts'
import { presetModulesConfig } from './preset-modules.ts'
import { presetPluginsConfig } from './preset-plugins.ts'
import { presetReactConfig } from './preset-react.ts'
import { presetSourceConfig } from './preset-source.ts'
import { presetTestsConfig } from './preset-tests.ts'
import { presetTypesConfig } from './preset-types.ts'
import { presetCommonRules, presetPolicyOrder } from './preset.constants.ts'
import { presetOverride, presetRuleSeverities, presetScopes, presetSeverity } from './preset.utils.ts'
import type { PresetOptions, PresetPolicies, PresetRules } from '../types/preset.types.ts'
import type { OxlintConfig, OxlintOverride } from 'oxlint'

export type {
  PresetOptions,
  PresetArchitecture,
  PresetArchitectureEntry,
  PresetFolderLayout,
  PresetFormattingOptions,
  PresetFramework,
  PresetNextOptions,
  PresetTanstackStartOptions,
  PresetLimitsOptions,
  PresetModulesOptions,
  PresetImportsOptions,
  PresetOrpcOptions,
  PresetSqlOptions,
  PresetFormsOptions,
  PresetReactOptions,
  PresetTestsOptions,
  PresetTestMockingApi,
  PresetTestMockingException,
  PresetTestMockingOptions,
  PresetTestMockingPreset,
  PresetPolicyOptions,
  PresetPolicy,
  PresetPolicyName,
  PresetTailwindOptions,
  PresetShadcnOptions,
} from '../types/preset.types.ts'

export function reactModulesPreset(options: PresetOptions = {}): OxlintConfig {
  const context = presetResolveContext(options)

  const policies: PresetPolicies = {
    ...presetSourceConfig(context),
    ...presetTypesConfig(context),
    ...presetModulesConfig(context),
    ...presetTestsConfig(context),
    ...presetReactConfig(context),
    ...presetBoundariesConfig(context),
  }

  const plugins = presetPluginsConfig(context)
  const { level, app, safetyFiles, ui, generated, nextWeb } = context
  const severities = options.ruleSeverities ?? {}
  const levels = (rules: PresetRules) => presetRuleSeverities(presetSeverity(rules, level), severities)

  const maxLines = (max: number): PresetRules => ({
    'max-lines': ['error', { max, skipBlankLines: true, skipComments: true }],
  })

  const overrides: OxlintOverride[] = presetPolicyOrder.flatMap((name) => {
    const setting = options.policies?.[name]
    const defaults = policies[name]

    if (setting === false || !defaults) {
      return []
    }

    const entries = typeof setting === 'function' ? setting(structuredClone(defaults)) : structuredClone(defaults)
    return entries.map((entry) => ({ ...entry, rules: entry.rules ? levels(entry.rules) : undefined }))
  })

  overrides.push(
    presetOverride(
      safetyFiles,
      levels({
        ...maxLines(options.limits?.maxFileLines ?? 400),
        complexity: ['error', { max: options.limits?.maxFunctionComplexity ?? 32 }],
      }),
      ui,
    ),
    presetOverride(presetScopes(app, '**/*.types.ts'), levels(maxLines(options.limits?.maxTypeFileLines ?? 1000)), ui),
  )
  const overrideRules = overrides.flatMap((entry) => Object.keys(entry.rules ?? {}))
  const named = new Set([...Object.keys(presetCommonRules), ...overrideRules])
  const unnamedLevels = Object.fromEntries(Object.entries(severities).filter(([rule]) => !named.has(rule)))

  for (const [rule, files] of Object.entries(options.ruleExclusions ?? {})) {
    overrides.push({ files, rules: { [rule]: 'off' } })
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
      ...(nextWeb.length ? ['**/.next/**', '**/next-env.d.ts'] : []),
      ...generated,
      ...(options.ignorePatterns ?? []),
    ],
    ...plugins,
    rules: { ...levels(presetCommonRules), ...unnamedLevels },
    overrides: overrides.filter((entry) => entry.files.length > 0),
  }
}

export function nextReactModulesPreset(options: PresetOptions = {}): OxlintConfig {
  return reactModulesPreset({ ...options, framework: options.framework ?? 'next' })
}

export function tanstackStartReactModulesPreset(options: PresetOptions = {}): OxlintConfig {
  return reactModulesPreset({ ...options, framework: options.framework ?? 'tanstack-start' })
}
