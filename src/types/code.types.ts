import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export type CodeConstructorEntry = string | { name: string; message?: string }

export interface CodeConstructorOptions {
  constructors: CodeConstructorEntry[]
  checkCalls?: boolean
  message?: string
}

export interface CodeLiteralInOptions {
  allow: string[]
}

export interface CodeMutableStateOptions {
  kinds?: ('let' | 'var')[]
  allowNamePattern?: OptionsPattern
}

export interface CodeObjectParamsOptions {
  maxParams?: number
  allDeclarations?: boolean
  serviceMethods?: boolean
  allowPattern?: OptionsPattern
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
  checkAssignments: boolean
}

export type CodePromiseMutationBinding = Pick<ESTree.IdentifierReference, 'name' | 'range'>

export interface CodeTrivialFunctionsOptions {
  allowPattern?: OptionsPattern
  allowCallees?: string[]
  allowAsync?: boolean
  mode?: 'legacy' | 'precise'
  checkServiceMethods?: boolean
  bannedNames?: string[]
  checkGenericGuards?: boolean
}

export interface CodeTrivialFunctionsGuardState {
  values: Set<string>
  predicates: Set<string>
  primitive: boolean
  returned: boolean
  globalArray: (node: ESTree.Node) => boolean
}
