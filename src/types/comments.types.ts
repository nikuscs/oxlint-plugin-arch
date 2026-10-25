import type { ESTree } from '@oxlint/plugins'

export interface CommentsOptions {
  allowWhy?: boolean
  allowPatterns?: string[]
  allowJsdoc?: boolean
}

export interface CommentsLines {
  starts: number[]
  ends: number[]
}

export interface CommentsMembersOptions {
  allowWhy?: boolean
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
