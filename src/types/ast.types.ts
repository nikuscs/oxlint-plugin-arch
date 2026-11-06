import type { ESTree } from '@oxlint/plugins'

export type AstFunction = ESTree.Function | ESTree.ArrowFunctionExpression

export type AstCall = ESTree.CallExpression | ESTree.NewExpression
