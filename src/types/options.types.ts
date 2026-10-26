import type { RuleOptionsSchema } from '@oxlint/plugins'

export type OptionsPattern = string | string[]

export type OptionsSchema = Exclude<RuleOptionsSchema, false | unknown[]>

export type OptionsSchemaProperties = NonNullable<OptionsSchema['properties']>
