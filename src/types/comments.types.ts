import type { ESTree } from '@oxlint/plugins'

export interface CommentsOptions {
  why?: boolean
  allow?: string[]
  jsdoc?: boolean
  members?: 'off' | 'also' | 'only'
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
