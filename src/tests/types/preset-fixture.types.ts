export interface PresetFixtureDiagnostic {
  code: string
  filename: string
  severity: string
  message: string
}

export interface PresetFixtureOutput {
  diagnostics: PresetFixtureDiagnostic[]
  number_of_files: number
}

export interface PresetFixtureResult {
  root: string
  status: number | null
  output: PresetFixtureOutput
}

export interface PresetFixtureExpectation {
  name: string
  project: string
  file: string
  rules: string[]
  absent?: string[]
  decisions: number[]
}

export interface PresetRuleLocation {
  project: string
  file: string
}

export interface PresetRuleFixture {
  rule: string
  pass: PresetRuleLocation
  fail: PresetRuleLocation
  source?: string
}

export type PresetRuleSetting = string | number | [string | number, ...unknown[]]

export interface PresetEffectiveScope {
  rules?: Record<string, PresetRuleSetting>
}

export interface PresetEffectiveConfig extends PresetEffectiveScope {
  overrides: PresetEffectiveScope[]
}
