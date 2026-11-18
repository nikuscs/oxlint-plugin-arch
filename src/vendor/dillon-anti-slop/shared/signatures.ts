import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree, SourceCode } from '@oxlint/plugins'

export function signaturesParameterAnnotation(parameter: ESTree.ParamPattern | ESTree.BindingPattern): ESTree.TSTypeAnnotation | null | undefined {
  if (parameter.type === 'TSParameterProperty') {
    return signaturesParameterAnnotation(parameter.parameter)
  }

  if (parameter.type === 'RestElement') {
    return parameter.typeAnnotation ?? signaturesParameterAnnotation(parameter.argument)
  }

  if (parameter.type === 'AssignmentPattern') {
    return parameter.typeAnnotation ?? signaturesParameterAnnotation(parameter.left)
  }

  return parameter.typeAnnotation
}

export function signaturesParameterName(parameter: ESTree.ParamPattern | ESTree.BindingPattern, sourceCode: SourceCode): string {
  if (parameter.type === 'TSParameterProperty') {
    return signaturesParameterName(parameter.parameter, sourceCode)
  }

  if (parameter.type === 'AssignmentPattern') {
    return signaturesParameterName(parameter.left, sourceCode)
  }

  if (parameter.type === 'RestElement') {
    return signaturesParameterName(parameter.argument, sourceCode)
  }

  if (parameter.type === 'Identifier') {
    return parameter.name
  }

  const text = sourceCode.getText(parameter)
  const annotationStart = parameter.typeAnnotation?.start

  return annotationStart === undefined ? text : text.slice(0, annotationStart - parameter.start).trimEnd()
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
