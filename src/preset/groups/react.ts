import { presetA11yRules, presetEffectsRules, presetReactRules } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder, PresetRules } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const reactGroup: PresetBuilder<'react'> = (project, settings) => {
  const { reactFiles, web, ui, testFiles, components } = project
  const memo = settings.memo ?? settings.compiler
  const perf = settings.perf ?? !settings.compiler
  const rules: PresetRules = { ...presetReactRules, 'arch/layout-jsx-attributes': ['error', { min: 3 }] }

  if (perf) {
    for (const rule of ['new-object', 'new-array', 'new-function', 'jsx']) {
      rules[`react-perf/jsx-no-${rule}-as-prop`] = 'error'
    }
  }

  const overrides: OxlintOverride[] = [
    presetOverride(reactFiles, rules, ui),
    presetOverride(components, { 'arch/files-helpers': ['error', { components: true, hooks: '^use[A-Z]' }] }, [...ui, ...testFiles]),
  ]

  if (settings.effects) {
    overrides.push(presetOverride(reactFiles, { ...presetEffectsRules, 'arch/react-empty-effect': 'error' }, ui))
  }

  if (memo) {
    overrides.push(presetOverride(reactFiles, { 'arch/react-memo': 'error' }, ui))
  }

  if (web.length > 0) {
    overrides.push(
      presetOverride(project.webFiles, {
        'arch/boundaries-token-owner': [
          'error',
          {
            restrictions: [
              { token: 'RouterClient', allow: [...project.rpcClients] },
              { token: 'createContext', patterns: [...presetScopes(web, 'context/'), ...project.webUiRoots.map((path) => `${path}/`)] },
            ],
          },
        ],
      }),
    )
  }

  if (settings.props) {
    overrides.push(presetOverride(components, { 'arch/react-props': ['error', { prefix: true }] }, [...ui, ...testFiles]))
  }

  if (!settings.a11y) {
    overrides.push(presetOverride(['**/*.{tsx,jsx}'], Object.fromEntries(presetA11yRules.map((rule) => [rule, 'off']))))
  }

  return overrides
}
