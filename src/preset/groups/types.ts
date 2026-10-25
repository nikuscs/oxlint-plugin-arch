import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const typesGroup: PresetBuilder<'types'> = (project, settings) => {
  const { web, backend, packageSources, app, appFiles, services, utilities, types, ui, testFiles, components, hooks } = project
  const schemaOwners = backend.length > 0 ? backend : project.nextWeb
  const runtimeFreeTypes = backend.length > 0 ? web : [...project.tanstackWeb, ...project.expoWeb]
  const colocated = project.colocated
  const overrides: OxlintOverride[] = []

  if (settings.placement) {
    overrides.push(
      presetOverride(appFiles, { 'arch/types-declarations': 'error' }, [
        ...types,
        ...colocated,
        ...components,
        ...hooks,
        ...services,
        ...ui,
        ...testFiles,
      ]),
      presetOverride(services, { 'arch/types-service': 'error' }, [...utilities, ...testFiles]),
      presetOverride(
        [...components, ...hooks],
        {
          'arch/types-local-alias': 'error',
          'arch/naming-types': 'error',
          'arch/naming-declarations': [
            'error',
            { kinds: ['interface'], stem: 'before-first-dot', normalize: 'remove-separators' },
          ],
        },
        [...ui, ...testFiles],
      ),
      presetOverride(
        presetScopes(app, '**/*.types.ts'),
        { 'arch/files-restricted': ['error', { message: 'Domain types belong in src/types.' }] },
        [...types, ...colocated, ...ui],
      ),
      presetOverride(presetScopes(app, '**/*.{utils,constants}.ts'), { 'arch/types-declarations': 'error' }, [...ui, ...testFiles]),
      presetOverride(
        [...presetScopes([...schemaOwners, ...packageSources], 'types/**/*.types.ts'), ...colocated, ...presetScopes(app, '**/*.constants.ts')],
        { 'arch/files-no-functions': ['error', { banReExports: false }] },
      ),
      ...(runtimeFreeTypes.length > 0
        ? [
          presetOverride(presetScopes(runtimeFreeTypes, 'types/**/*.types.ts'), {
            'arch/files-types-only': ['error', { runtimeImports: 'ban', allowImportSources: [], banReExports: true }],
          }),
        ]
        : []),
    )
  }

  if (settings.safety) {
    overrides.push(
      presetOverride(project.safetyFiles, {
        'typescript/no-explicit-any': 'error',
        'typescript/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': true, 'ts-check': false }],
        'arch/types-unknown': 'error',
        'arch/types-imported-alias': 'error',
        'arch/code-literal-in': 'error',
        'arch/code-promise-mutation': 'error',
        'arch/code-constructor': ['error', { constructors: ['Error'], checkCalls: true }],
        'dillon-anti-slop/no-chained-type-assertions': 'error',
        'dillon-anti-slop/no-conditional-empty-object-spread': 'error',
        'dillon-anti-slop/no-known-value-widening': 'error',
        'dillon-anti-slop/no-reflect-apply': 'error',
        'dillon-anti-slop/no-reflect-get': 'error',
        'dillon-anti-slop/no-runtime-typeof': 'error',
        'dillon-anti-slop/no-shape-in-symbol-names': 'error',
        'dillon-anti-slop/no-unknown-parameters': 'error',
        'dillon-anti-slop/no-unknown-returns': 'error',
        'dillon-anti-slop/no-unknown-type-aliases': 'error',
        'dillon-anti-slop/no-unsafe-dictionary-type': 'error',
        'dillon-anti-slop/no-widen-then-assert': 'error',
        'dillon-anti-slop/require-safety-comment-for-type-assertion': 'error',
      }),
    )
  }

  return overrides
}
