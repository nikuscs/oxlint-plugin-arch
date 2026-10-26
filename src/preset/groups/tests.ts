import { optionsAssertMockingApis } from '../../utils/options.utils.ts'
import { presetStrictMockingMessage, presetTestMockingAllow, presetTestMockingApis, presetTestRules } from '../preset.constants.ts'
import { PresetError, presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder, PresetMockingOptions, PresetRules } from '../../types/preset.types.ts'

export const testsGroup: PresetBuilder<'tests'> = (project, settings) => {
  const { functions, assertions } = settings
  const testFunctions = ['test', 'it', ...functions]

  if (testFunctions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(name))) {
    throw new PresetError('Test functions must be literal identifiers or dotted names.')
  }

  if (assertions.some((name) => !/^[A-Za-z_$][\w$]*(?:\.[\w$*]+)*$/.test(name))) {
    throw new PresetError('Assertion functions must be rooted dotted names or patterns.')
  }

  const configured = settings.mocking
  const mocking: PresetMockingOptions = typeof configured === 'string' ? { preset: configured } : configured
  const preset = mocking.preset ?? 'modules'

  if (!['modules', 'strict'].includes(preset)) {
    throw new PresetError('Unknown test mocking preset.')
  }

  const deny = [...(mocking.deny ?? []), ...presetTestMockingApis[preset]].map((entry) =>
    typeof entry === 'string' && preset === 'strict' ? { api: entry, message: presetStrictMockingMessage } : entry,
  )

  const allow = [...presetTestMockingAllow[preset], ...(mocking.allow ?? [])].toSorted(
    (left, right) => Number(left.apis.includes('*')) - Number(right.apis.includes('*')),
  )

  optionsAssertMockingApis([...deny.map((entry) => (typeof entry === 'string' ? entry : entry.api)), ...allow.flatMap((entry) => entry.apis)])

  const customized = preset !== 'modules' || (mocking.deny ?? []).length > 0
  const mockingRule = (apis: string[]): PresetRules[string] => ['error', { deny, allow: ['*.fn', ...apis], checkDestructured: customized }]
  const backendRules: PresetRules = { 'arch/tests-concurrent-db': 'error' }

  if (settings.fixtures) {
    backendRules['no-restricted-imports'] = [
      'error',
      { patterns: [...project.baseImports, { group: ['**/helpers/**'], message: 'Use named fixtures or tests/support.' }] },
    ]
  }

  const rules: PresetRules = {
    ...presetTestRules,
    'dillon-anti-slop/no-module-mocking': customized ? mockingRule([]) : 'error',
    'arch/tests-modifiers': ['error', { functions }],
    'arch/tests-assertions': ['error', { functions, assertions }],
  }

  if (settings.titles) {
    rules['arch/tests-titles'] = ['error', { callees: ['describe', ...testFunctions], deny: '^should\\b', flags: 'i' }]
  }

  return [
    presetOverride(project.testFiles, rules),
    presetOverride(
      presetScopes(project.units.map((unit) => unit.source), '**/*.{test,spec}.{ts,tsx,mts,cts}'),
      { 'arch/files-restricted': ['error', { message: 'Tests live in a tests/ folder, not next to the code.' }] },
      ['**/tests/**', '**/test/**'],
    ),
    presetOverride(presetScopes(project.backendRoots, 'tests/**/*.ts'), backendRules),
    ...allow.map((entry) =>
      presetOverride(entry.files, { 'dillon-anti-slop/no-module-mocking': entry.apis.includes('*') ? 'off' : mockingRule(entry.apis) }),
    ),
  ]
}
