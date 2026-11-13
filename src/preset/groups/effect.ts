import { presetExtensions } from '../preset.constants.ts'
import { presetEffectPackages, presetEffectStyle, presetOverride } from '../preset.utils.ts'
import type { PresetBuilder, PresetRules } from '../../types/preset.types.ts'

const effectOff: PresetRules = {
  'linteffect/no-effect-fn-generator': 'off',
  'linteffect/prefer-extracted-concept': 'off',
  'linteffect/no-clever-effect-expression': 'off',
  'linteffect/no-mixed-pillar-function': 'off',
  'linteffect/no-piped-yield-in-gen': 'off',
  'linteffect/no-domain-logic-in-conditional': 'off',
  'linteffect/prefer-pipe-for-behavior': 'off',
  'linteffect/no-ternary': 'off',
  'linteffect/no-effect-as': 'off',
  'linteffect/no-namespace-effect-import': 'off',
  'linteffect/no-manual-effect-channels': 'off',
  'linteffect/no-or-die-outside-boundary': 'off',
  'linteffect/no-call-tower': 'off',
  'linteffect/no-pipe-ladder': 'off',
  'linteffect/no-nested-effect-gen': 'off',
  'linteffect/no-branch-in-object': 'off',
  'linteffect/no-magic-domain-string': 'off',
  'linteffect/no-return-in-arrow': 'off',
  'linteffect/no-effect-succeed-variable': 'off',
  'linteffect/no-match-effect-branch': 'off',
}

const effectEntryOff: PresetRules = {
  'effecttsgo/strict-effect-provide': 'off',
  'linteffect/no-inline-runtime-provide': 'off',
  'linteffect/no-inline-layer-provide-in-program': 'off',
}

const effectTestOff: PresetRules = {
  ...effectEntryOff,
  'linteffect/no-string-sentinel-return': 'off',
  'linteffect/no-effect-never': 'off',
  'linteffect/no-gen-for-mapping': 'off',
  'linteffect/no-adhoc-domain-error': 'off',
}

export const effectGroup: PresetBuilder<'effect'> = (project, settings) => {
  const files = [`**/${presetExtensions}`]
  const max = settings.width

  const style = presetOverride(files, {
    'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    'eslint-js/max-len': ['error', { code: max, ignoreUrls: true, ignoreComments: true, ignoreRegExpLiterals: true }],
    ...presetEffectStyle().rules,
  })

  if (!settings.code) {
    return [style]
  }

  const { tsgo, linteffect } = presetEffectPackages()
  const tsgoRules = [tsgo.correctness, tsgo.antipattern, tsgo.effectNative, tsgo.style].flatMap((config) => Object.keys(config.rules ?? {}))

  return [
    style,
    presetOverride(files, {
      ...Object.fromEntries(tsgoRules.map((rule) => [rule, 'error'])),
      ...linteffect.recommended.rules,
      ...effectOff,
    }),
    presetOverride(project.testFiles, effectTestOff),
    ...(settings.entries.length > 0 ? [presetOverride(settings.entries, effectEntryOff)] : []),
    presetOverride(files, {
      'arch/code-trivial-functions': 'off',
      'arch/code-branch-once': 'error',
      'arch/code-object-params': ['error', { all: true, services: true }],
      'arch/code-switch': ['error', { message: 'Branch with Match.' }],
      'arch/naming-exports': 'off',
      'arch/code-function-nesting': ['error', { max: 4 }],
      'arch/code-inline': ['error', { max, nesting: 2, callbacks: true, keep: ['^[A-Z]', '^layer'], allow: '^(?:decode|encode)[A-Z]', services: ['of'] }],
      'arch/code-yield-argument': 'error',
      'arch/effect-layers': 'error',
      'arch/effect-merge-pipe': 'error',
      'arch/effect-values-first': 'error',
      'arch/layout-arrow-body': ['error', { max }],
      'arch/layout-call-arguments': ['error', { split: false, pipe: { min: 2 }, hug: { max }, join: { max, nesting: 2, keep: ['Layer.mergeAll'] } }],
      'arch/layout-call-depth': ['error', { max: 2, callbacks: true }],
      'arch/layout-items': 'error',
      'arch/layout-object': ['error', { min: 3, scope: 'call-args', params: true, nested: true, siblings: true, inner: 2 }],
      'arch/layout-pipe': 'error',
      'arch/layout-ternary': ['error', { max: 100, branch: { max: 3 } }],
      'arch/layout-type-arguments': ['error', { min: 3 }],
    }),
    presetOverride(
      files,
      {
        'arch/code-justified-call': [
          'error',
          { calls: ['Effect.promise'], message: 'Effect.promise turns a rejection into a defect; otherwise use Effect.tryPromise with a tagged error.' },
        ],
        'arch/code-traced': ['error', { exports: settings.exports, skip: settings.skip, message: "An exported function or service method gets a span: use Effect.fn('<name>')." }],
      },
      project.testFiles,
    ),
  ]
}
