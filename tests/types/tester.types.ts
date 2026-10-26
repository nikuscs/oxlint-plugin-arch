import type { PresetFolders } from '../../src/types/preset.types.ts'
import type { OxlintConfig } from 'oxlint'
import type { RuleTester } from 'oxlint/plugins-dev'

export type TesterOption = NonNullable<RuleTester.ValidTestCase['options']>[number]

interface TesterBase {
  name: string
  code: string
  filename?: string
  files?: Partial<Record<string, string>>
  options?: object | object[]
}

export type TesterRow = TesterBase & ({ output?: undefined, errors?: undefined } | { output?: string | null, errors: string[] })

export interface TesterPresetRow {
  name: string
  tree?: string[]
  files?: Record<string, string>
  symlinks?: Record<string, string>
  link?: boolean
  folders: PresetFolders
  detect?: boolean
  file: string
  rule: string
  expected: unknown
}

export type TesterPresetValue = NonNullable<OxlintConfig['rules']>[string] | 'ignored'
