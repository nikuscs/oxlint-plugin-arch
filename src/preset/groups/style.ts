import { presetExtensions, presetFormattingRules } from '../preset.constants.ts'
import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder, PresetRules } from '../../types/preset.types.ts'

export const styleGroup: PresetBuilder<'style'> = (_project, settings) => {
  const files = [`**/${presetExtensions}`]
  const layout: PresetRules = {}

  if (settings.padding) {
    layout['arch/layout-padding'] = ['error', { multiline: true }]
  }

  if (settings.multiline) {
    layout['arch/layout-object'] = ['error', { min: 3, scope: 'call-args' }]
    layout['arch/layout-call-array'] = ['error', { callees: ['Promise.all'], min: 2 }]
    layout['arch/layout-key-value'] = 'error'
  }

  if (settings.dashes) {
    layout['arch/copy-dashes'] = 'error'
  }

  return [
    presetOverride(files, {
      ...presetFormattingRules,
      'eslint-js/semi': ['error', settings.semicolons ? 'always' : 'never'],
      'eslint-js/quotes': ['error', settings.quotes, { avoidEscape: true }],
    }),
    presetOverride(files, layout),
  ]
}
