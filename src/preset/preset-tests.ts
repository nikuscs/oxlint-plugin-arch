import { optionsAssertMockingApis } from '../utils/options.utils.ts'
import {
  presetStrictMockingMessage,
  presetTestMockingAllow,
  presetTestMockingApis,
  presetTestRules,
} from './preset.constants.ts'
import { PresetError, presetOverride, presetScopes } from './preset.utils.ts'
import type { PresetContext, PresetPolicies, PresetRules } from '../types/preset.types.ts'

export function presetTestsConfig(context: PresetContext): PresetPolicies {
  const { backendRoots, testFiles, baseImports, options } = context
  const profile = options.tests?.profile ?? 'fixtures'

  if (!['standard', 'fixtures'].includes(profile)) {
    throw new PresetError('Unknown test profile.')
  }

  const additionalTestFunctions = options.tests?.additionalTestFunctions ?? []
  const testFunctions = ['test', 'it', ...additionalTestFunctions]
  const assertionFunctions = options.tests?.additionalAssertionFunctions ?? []

  if (testFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(name))) {
    throw new PresetError('Additional test functions must be literal identifiers or dotted names.')
  }

  if (assertionFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[\w$*]+)*$/.test(name))) {
    throw new PresetError('Assertion functions must be rooted dotted names or patterns.')
  }

  const configured = options.tests?.mocking
  const mocking = typeof configured === 'string' ? { preset: configured } : (configured ?? {})
  const preset = mocking.preset ?? 'modules'

  if (!['modules', 'strict'].includes(preset)) {
    throw new PresetError('Unknown test mocking preset.')
  }

  const deny = [...(mocking.deny ?? []), ...presetTestMockingApis[preset]].map((entry) =>
    typeof entry === 'string' && preset === 'strict' ? { api: entry, message: presetStrictMockingMessage } : entry,
  )

  const allow = [...presetTestMockingAllow[preset], ...(mocking.allow ?? [])].sort(
    (left, right) => Number(left.apis.includes('*')) - Number(right.apis.includes('*')),
  )

  optionsAssertMockingApis([
    ...deny.map((entry) => (typeof entry === 'string' ? entry : entry.api)),
    ...allow.flatMap((entry) => entry.apis),
  ])
  const customized = preset !== 'modules' || (mocking.deny ?? []).length > 0

  const mockingRule = (apis: string[]): PresetRules[string] => [
    'error',
    { deny, allow: ['*.fn', ...apis], checkDestructured: customized },
  ]

  const backendTestRules: PresetRules = { 'arch/tests-concurrent-db': 'error' }

  if (profile === 'fixtures') {
    backendTestRules['no-restricted-imports'] = [
      'error',
      { patterns: [...baseImports, { group: ['**/helpers/**'], message: 'Use named fixtures or tests/support.' }] },
    ]
  }

  return {
    tests: [
      presetOverride(testFiles, {
        ...presetTestRules,
        'dillon-anti-slop/no-module-mocking': customized ? mockingRule([]) : 'error',
        'arch/tests-modifiers': ['error', { additionalTestFunctions }],
        'arch/tests-assertions': ['error', { additionalTestFunctions, additionalAssertionFunctions: assertionFunctions }],
        'arch/tests-titles': ['error', { callees: ['describe', ...testFunctions], forbid: '^should\\b', flags: 'i' }],
      }),
      presetOverride(presetScopes(backendRoots, 'tests/**/*.ts'), backendTestRules),
      ...allow.map((entry) =>
        presetOverride(entry.files, {
          'dillon-anti-slop/no-module-mocking': entry.apis.includes('*') ? 'off' : mockingRule(entry.apis),
        }),
      ),
    ],
  }
}
