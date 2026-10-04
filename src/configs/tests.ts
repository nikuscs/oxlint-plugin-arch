import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import { presetTestRules } from '../constants/preset.constants.ts'

export function presetTestsConfig(context: PresetContext): PresetPolicies {
  const { backend, testFiles, baseImports } = context
  const policies: PresetPolicies = {}
  policies.tests = [
    presetOverride(testFiles, {
      ...presetTestRules,
      'dillon-anti-slop/no-module-mocking': 'error',
      'modules/test-modifiers': 'error',
      'arch/test-title-pattern': ['error', { forbid: '^should\\b', flags: 'i' }],
    }),
    presetOverride(
      presetScopes(
        backend.map((path) => path.replace(/\/src$/, '')),
        'tests/**/*.ts',
      ),
      {
        'modules/concurrent-db': 'error',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...baseImports,
              {
                group: ['**/helpers/**'],
                message: 'Use named fixtures or tests/support.',
              },
            ],
          },
        ],
      },
    ),
  ]
  return policies
}
