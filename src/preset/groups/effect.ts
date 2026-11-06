import { presetExtensions } from '../preset.constants.ts'
import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const effectGroup: PresetBuilder<'effect'> = (project, settings) => {
  const files = [`**/${presetExtensions}`]
  const max = settings.width

  return [
    presetOverride(files, {
      'arch/code-trivial-functions': 'off',
      'arch/code-branch-once': 'error',
      'arch/code-function-nesting': ['error', { max: 4 }],
      'arch/code-inline': ['error', { max, nesting: 2, keep: ['^[A-Z]', '^layer'], allow: '^(?:decode|encode)[A-Z]', services: ['of'] }],
      'arch/code-justified-call': [
        'error',
        { calls: ['Effect.promise'], message: 'Effect.promise turns a rejection into a defect; otherwise use Effect.tryPromise with a tagged error.' },
      ],
      'arch/code-yield-argument': 'error',
      'arch/layout-arrow-body': ['error', { max }],
      'arch/layout-call-arguments': ['error', { split: false, hug: { max }, join: { max, nesting: 2, keep: ['Layer.mergeAll'] } }],
      'arch/layout-call-depth': ['error', { max: 2 }],
      'arch/layout-items': 'error',
      'arch/layout-pipe': 'error',
      'arch/layout-ternary': ['error', { fit: false, branch: { max: 3 } }],
    }),
    presetOverride(
      files,
      { 'arch/code-traced': ['error', { exports: settings.exports, message: "An exported function or service method gets a span: use Effect.fn('<name>')." }] },
      project.testFiles,
    ),
  ]
}
