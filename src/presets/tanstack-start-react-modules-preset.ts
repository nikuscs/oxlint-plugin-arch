import type { OxlintConfig } from 'oxlint'
import type { PresetOptions } from '../types/preset.types.ts'
import reactModulesPreset from './react-modules-preset.ts'

/** The React modules preset with TanStack Start as the default web framework. */
export default function tanstackStartReactModulesPreset(options: PresetOptions = {}): OxlintConfig {
  return reactModulesPreset({ ...options, framework: options.framework ?? 'tanstack-start' })
}
