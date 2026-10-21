import type { OxlintConfig } from 'oxlint'
import type { PresetOptions } from '../types/preset.types.ts'
import reactModulesPreset from './react-modules-preset.ts'

/** The React modules preset with Next.js App Router as the default web framework. */
export default function nextReactModulesPreset(options: PresetOptions = {}): OxlintConfig {
  return reactModulesPreset({ ...options, framework: options.framework ?? 'next' })
}
