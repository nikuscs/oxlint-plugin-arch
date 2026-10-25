import type { AstFunction } from './ast.types.ts'
import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface TestsModifiersOptions {
  functions?: string[]
}

export interface TestsAssertionsOptions extends TestsModifiersOptions {
  assertions?: string[]
}

export interface TestsAssertionsRegistration {
  call: ESTree.CallExpression
  callback: AstFunction
  table?: ESTree.Expression
}

export interface TestsAssertionsRow {
  bindings: Map<ESTree.Node, AstFunction>
  callbacks: AstFunction[]
}

export interface TestsAssertionsState {
  tests: string[]
  patterns: RegExp[]
  assertionRoots: Set<string>
  functions: Map<ESTree.Node, AstFunction>
  values: Map<ESTree.Node, ESTree.Expression>
  aliases: Map<ESTree.Node, string>
  shadowed: Set<ESTree.Node>
  calls: ESTree.CallExpression[]
  allowed: Set<AstFunction>
}

export interface TestsTitlesOptions {
  callees: string[]
  deny?: OptionsPattern
  require?: OptionsPattern
  flags?: string
}

export interface TestsTitlesPattern {
  regex: RegExp
  pattern: string
}
