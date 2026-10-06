import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import { presetTestRules } from '../constants/preset.constants.ts'

export function presetTestsConfig(context: PresetContext): PresetPolicies {
  const { backend, testFiles, baseImports, options } = context
  const profile = options.tests?.profile ?? 'fixtures'
  if (profile !== 'standard' && profile !== 'fixtures') throw new Error('Unknown test profile.')
  const testFunctions = ['test', 'it', ...(options.tests?.additionalTestFunctions ?? [])]
  const assertionFunctions = options.tests?.additionalAssertionFunctions ?? []
  if (testFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(name)))
    throw new Error('Additional test functions must be literal identifiers or dotted names.')
  if (assertionFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[\w$*]+)*$/.test(name)))
    throw new Error('Assertion functions must be rooted dotted names or patterns.')
  const policies: PresetPolicies = {}
  policies.tests = [
    presetOverride(testFiles, {
      ...presetTestRules,
      'dillon-anti-slop/no-module-mocking': 'error',
      'modules/test-modifiers': [
        'error',
        { additionalTestFunctions: options.tests?.additionalTestFunctions ?? [] },
      ],
      'modules/test-assertions': [
        'error',
        {
          additionalTestFunctions: options.tests?.additionalTestFunctions ?? [],
          additionalAssertionFunctions: assertionFunctions,
        },
      ],
      'arch/test-title-pattern': [
        'error',
        { callees: ['describe', ...testFunctions], forbid: '^should\\b', flags: 'i' },
      ],
    }),
    presetOverride(
      presetScopes(
        backend.map((path) => path.replace(/\/src$/, '')),
        'tests/**/*.ts',
      ),
      {
        'modules/concurrent-db': 'error',
        ...(profile === 'fixtures'
          ? {
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
            }
          : {}),
      },
    ),
  ]
  return policies
}
