import type { AstFunction } from './ast.types.ts'
import type { DeclarationsCandidate } from './declarations.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface ReactQueryPropsOptions {
  hooks?: string[]
  functions?: string[]
}

export interface ReactPropsOptions {
  prefix?: boolean
  suffix?: string
}

export interface ReactPropsComponent {
  candidate: DeclarationsCandidate
  index: number
}

export interface ReactPropsTarget {
  fn: AstFunction
  typeArgument?: ESTree.TSType
}
