import type { RuleTester } from 'oxlint/plugins-dev'

export type TesterOption = NonNullable<RuleTester.ValidTestCase['options']>[number]

export interface TesterRow {
  name: string
  code: string
  filename?: string
  files?: Partial<Record<string, string>>
  options?: object | object[]
  output?: string | null
  errors?: string[]
}
