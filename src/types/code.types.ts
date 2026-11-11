import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export type CodeConstructorEntry = string | { name: string; message?: string }

export interface CodeBranchOnceOptions {
  min?: number
}

export interface CodeConstructorOptions {
  constructors: CodeConstructorEntry[]
  calls?: boolean
  message?: string
}

export interface CodeDelegateOptions {
  methods?: string[]
  reads?: string[]
  max?: number
}

export interface CodeLiteralInOptions {
  allow: string[]
}

export interface CodeMutableStateOptions {
  kinds?: ('let' | 'var')[]
  allow?: OptionsPattern
}

export interface CodeObjectParamsOptions {
  max?: number
  all?: boolean
  services?: boolean
  allow?: OptionsPattern
}

export interface CodePairedCallPair {
  when: string
  require: string
}

export interface CodePairedCallOptions {
  when?: string
  require?: string
  pairs?: CodePairedCallPair[]
}

export interface CodePairedCallState extends CodePairedCallPair {
  firstWhen: ESTree.CallExpression | null
  sawRequired: boolean
}

export interface CodePromiseMutationOptions {
  combinators: string[]
  methods: string[]
  assignments: boolean
}

export type CodePromiseMutationBinding = Pick<ESTree.IdentifierReference, 'name' | 'range'>

export interface CodeTrivialFunctionsOptions {
  allow?: OptionsPattern
  callees?: string[]
  async?: boolean
  mode?: 'legacy' | 'precise'
  services?: boolean
  deny?: string[]
  guards?: boolean
  defaults?: boolean
}

export interface CodeTrivialFunctionsGuardState {
  values: Set<string>
  predicates: Set<string>
  primitive: boolean
  returned: boolean
  globalArray: (node: ESTree.Node) => boolean
}

export interface CodeInlineOptions {
  max?: number
  nesting?: number
  allow?: OptionsPattern
  keep?: OptionsPattern
  services?: string[]
}

export interface CodeFunctionNestingOptions {
  max?: number
}

export interface CodeJustifiedCallOptions {
  calls: string[]
  comment?: string
  message?: string
}

export interface CodeTracedOptions {
  untraced?: string[]
  exports?: OptionsPattern
  services?: string[]
  skip?: OptionsPattern
  message?: string
}
