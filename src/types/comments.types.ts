import type { DeclarationsKind } from './declarations.types.ts'
import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface CommentsOptions {
  why?: boolean | string
  allow?: string[]
  jsdoc?: boolean
  members?: 'off' | 'also' | 'only'
  steps?: boolean
}

export interface CommentsLines {
  starts: number[]
  ends: number[]
}

export type CommentsMemberNode =
  | ESTree.TSPropertySignature
  | ESTree.TSMethodSignature
  | ESTree.TSIndexSignature
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.ObjectProperty
  | ESTree.BindingProperty
  | ESTree.AssignmentTargetProperty
  | ESTree.SpreadElement

export interface CommentsHeaderOptions {
  comment: string
  imports?: OptionsPattern
  files?: OptionsPattern
  message?: string
}

export interface CommentsDocblockOptions {
  kinds?: DeclarationsKind[]
  names?: OptionsPattern
  message?: string
}
