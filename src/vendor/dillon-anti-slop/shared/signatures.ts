import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

export function signaturesParameterAnnotation(parameter: ESTree.ParamPattern): ESTree.TSTypeAnnotation | null | undefined {
  if (parameter.type === 'TSParameterProperty') {
    return signaturesParameterAnnotation(parameter.parameter)
  }

  if (parameter.type === 'RestElement') {
    return parameter.typeAnnotation ?? signaturesParameterAnnotation(parameter.argument)
  }

  if (parameter.type === 'AssignmentPattern') {
    return parameter.typeAnnotation ?? parameter.left.typeAnnotation
  }

  return parameter.typeAnnotation
}

export function signaturesListeners(listener: (node: DillonAntiSlopSignature) => void) {
  return {
    ArrowFunctionExpression: listener,
    FunctionDeclaration: listener,
    FunctionExpression: listener,
    TSCallSignatureDeclaration: listener,
    TSConstructSignatureDeclaration: listener,
    TSConstructorType: listener,
    TSDeclareFunction: listener,
    TSEmptyBodyFunctionExpression: listener,
    TSFunctionType: listener,
    TSMethodSignature: listener,
  }
}
