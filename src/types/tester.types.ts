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
