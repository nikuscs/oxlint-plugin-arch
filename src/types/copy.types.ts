import type { OptionsPattern } from './options.types.ts'

export interface CopyDashesOptions {
  deny?: string[]
  message?: string
}

export interface CopyHardcodedOptions {
  attributes?: string[]
  ignore?: OptionsPattern
  exclude?: OptionsPattern
  message?: string
}
