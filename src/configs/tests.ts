import type { PresetContext, PresetPolicies, PresetRules } from '../types/preset.types.ts'
import { mockingApiPatternsAssert } from '../utils/helpers/mocking.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import {
  presetStrictMockingMessage,
  presetTestMockingAllow,
  presetTestMockingApis,
  presetTestRules,
} from '../constants/preset.constants.ts'

export function presetTestsConfig(context: PresetContext): PresetPolicies {
  const { backendRoots, testFiles, baseImports, options } = context
  const profile = options.tests?.profile ?? 'fixtures'
  if (profile !== 'standard' && profile !== 'fixtures') throw new Error('Unknown test profile.')
  const testFunctions = ['test', 'it', ...(options.tests?.additionalTestFunctions ?? [])]
  const assertionFunctions = options.tests?.additionalAssertionFunctions ?? []
  if (testFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(name)))
    throw new Error('Additional test functions must be literal identifiers or dotted names.')
  if (assertionFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[\w$*]+)*$/.test(name)))
    throw new Error('Assertion functions must be rooted dotted names or patterns.')
  const mocking = typeof options.tests?.mocking === 'string' ? { preset: options.tests.mocking } : (options.tests?.mocking ?? {})
  const mockingPreset = mocking.preset ?? 'modules'
  if (mockingPreset !== 'modules' && mockingPreset !== 'strict') throw new Error('Unknown test mocking preset.')
  // Why: the rule reports the first matching deny entry, so caller entries go first to keep their message.
  const mockingDeny = [...(mocking.deny ?? []), ...presetTestMockingApis[mockingPreset]].map((entry) => {
    if (typeof entry !== 'string') return entry
    return mockingPreset === 'strict' ? { api: entry, message: presetStrictMockingMessage } : entry
  })
  // Why: a later override replaces an earlier one, so full exemptions go last and always win.
  const mockingAllow = [...presetTestMockingAllow[mockingPreset], ...(mocking.allow ?? [])].sort(
    (left, right) => Number(left.apis.includes('*')) - Number(right.apis.includes('*')),
  )
  mockingApiPatternsAssert([
    ...mockingDeny.map((entry) => (typeof entry === 'string' ? entry : entry.api)),
    ...mockingAllow.flatMap((entry) => entry.apis),
  ])
  const mockingCustomized = mockingPreset !== 'modules' || (mocking.deny ?? []).length > 0
  // Why: `fn` builds the fakes that replace mocks, so even `vi.*` keeps it.
  const mockingRule = (allow: string[]): PresetRules[string] => [
    'error',
    { deny: mockingDeny, allow: ['*.fn', ...allow], checkDestructured: mockingCustomized },
  ]
  const policies: PresetPolicies = {}
  policies.tests = [
    presetOverride(testFiles, {
      ...presetTestRules,
      'dillon-anti-slop/no-module-mocking': mockingCustomized ? mockingRule([]) : 'error',
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
      presetScopes(backendRoots, 'tests/**/*.ts'),
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
    ...mockingAllow.map((entry) =>
      presetOverride(entry.files, {
        'dillon-anti-slop/no-module-mocking': entry.apis.includes('*') ? 'off' : mockingRule(entry.apis),
      }),
    ),
  ]
  return policies
}
