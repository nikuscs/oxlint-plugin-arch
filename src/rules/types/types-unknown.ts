import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

/**
 * Rejects the `unknown` type except on the narrowed parameter of a type guard or the error parameter of a catch callback.
 *
 * Example: `type Value = unknown` fails; `function isUser(value: unknown): value is User` passes.
 */
export const typesUnknown = defineRule({
  meta: { type: 'problem', schema: [], messages: { forbidden: 'Use an owned domain type rather than unknown.' } },
  createOnce(context) {
    function catchName(node: ESTree.Node): boolean {
      const key = 'key' in node && !('computed' in node && node.computed) ? node.key : undefined
      return key?.type === 'Identifier' && key.name === 'catch'
    }

    function allowed(node: ESTree.Node): boolean {
      const annotation = node.parent
      const parameter = annotation?.type === 'TSTypeAnnotation' ? annotation.parent : undefined
      if (parameter?.type !== 'Identifier') return false
      const owner = parameter.parent
      if (!owner || !('params' in owner) || !owner.params.some((entry: ESTree.Node) => entry === parameter)) return false
      const predicate = 'returnType' in owner ? owner.returnType?.typeAnnotation : undefined
      if (predicate?.type === 'TSTypePredicate' && predicate.parameterName.type === 'Identifier')
        return predicate.parameterName.name === parameter.name
      if (owner.params[0] !== parameter) return false
      const holder = owner.parent
      if (!holder) return false
      if (catchName(owner) || catchName(holder)) return true
      if (holder.type === 'TSTypeAnnotation' && holder.parent && catchName(holder.parent)) return true
      return (
        holder.type === 'CallExpression' &&
        holder.arguments.some((entry) => entry === owner) &&
        holder.callee.type === 'MemberExpression' &&
        !holder.callee.computed &&
        holder.callee.property.type === 'Identifier' &&
        holder.callee.property.name === 'catch'
      )
    }

    return {
      TSUnknownKeyword(node) {
        if (!allowed(node)) context.report({ node, messageId: 'forbidden' })
      },
    }
  },
})
