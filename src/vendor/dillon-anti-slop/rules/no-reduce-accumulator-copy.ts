import { defineRule } from '@oxlint/plugins'
import {
  arrayMethodBinding,
  arrayMethodConstInit,
  arrayMethodIsKnownArray,
  arrayMethodIsReassigned,
  arrayMethodIsWrapper,
  arrayMethodTarget,
  arrayMethodUnwrap,
} from '../shared/array-method.ts'
import type { DillonAntiSlopReducer } from '../../../types/dillon-anti-slop.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

const arrayCopies = new Set(['concat', 'slice', 'toSpliced', 'toSorted', 'toReversed', 'with'])

function enclosingReducer(node: PluginsTypes.ESTree.Node): DillonAntiSlopReducer | null {
  let parent = node.parent

  while (parent !== null) {
    if (parent.type === 'FunctionDeclaration') {
      return null
    }

    if (parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression') {
      const callback = parent
      let owner: PluginsTypes.ESTree.Node = callback.parent

      while (arrayMethodIsWrapper(owner)) {
        owner = owner.parent
      }

      const method = owner.type === 'CallExpression' ? arrayMethodTarget(owner.callee) : null
      const firstArgument = owner.type === 'CallExpression' ? owner.arguments.at(0) : undefined
      const initialValue = owner.type === 'CallExpression' ? owner.arguments.at(1) : undefined
      const firstParameter = callback.params.at(0)
      const accumulator = firstParameter?.type === 'AssignmentPattern' ? firstParameter.left : firstParameter

      if (
        owner.type !== 'CallExpression' ||
        method === null ||
        (method.name !== 'reduce' && method.name !== 'reduceRight') ||
        owner.arguments.length > 2 ||
        firstArgument === undefined ||
        firstArgument.type === 'SpreadElement' ||
        arrayMethodUnwrap(firstArgument) !== callback ||
        accumulator?.type !== 'Identifier'
      ) {
        return null
      }

      return { accumulator, callback, initialValue }
    }
    parent = parent.parent
  }

  return null
}

function referencesAccumulator(
  sourceCode: PluginsTypes.SourceCode,
  node: PluginsTypes.ESTree.Expression,
  accumulator: PluginsTypes.Variable,
  visited = new Set<PluginsTypes.Variable>(),
): boolean {
  const variable = arrayMethodBinding(sourceCode, node)

  if (variable === null || visited.has(variable)) {
    return false
  }

  if (variable === accumulator) {
    return true
  }
  visited.add(variable)

  const init = arrayMethodIsReassigned(variable) ? null : arrayMethodConstInit(variable)

  return init !== null && referencesAccumulator(sourceCode, init, accumulator, visited)
}

function isGlobalCopyOwner(sourceCode: PluginsTypes.SourceCode, node: PluginsTypes.ESTree.Expression, name: string): boolean {
  const unwrapped = arrayMethodUnwrap(node)

  if (unwrapped.type !== 'Identifier' || unwrapped.name !== name) {
    return false
  }

  const variable = arrayMethodBinding(sourceCode, unwrapped)

  return variable === null || variable.defs.length === 0
}

export const noReduceAccumulatorCopyRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow copying growing reducer accumulators with Object.assign, Array.from, or array copy methods.',
    },
    messages: {
      accumulatorCopy: 'Do not copy the reducer accumulator on every iteration; growing copies can cause quadratic work. Mutate a fresh, locally owned accumulator and return it, or use an iterator pipeline/flatMap.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const method = arrayMethodTarget(node.callee)

        if (method === null || (method.name !== 'assign' && method.name !== 'from' && !arrayCopies.has(method.name))) {
          return
        }

        const reducer = enclosingReducer(node)

        if (reducer === null) {
          return
        }

        const accumulator = context.sourceCode
          .getDeclaredVariables(reducer.callback)
          .find((variable) => variable.identifiers.some((identifier) => identifier.start === reducer.accumulator.start))

        if (accumulator === undefined) {
          return
        }

        const isAccumulator = (expression: PluginsTypes.ESTree.Argument) =>
          expression.type !== 'SpreadElement' && referencesAccumulator(context.sourceCode, expression, accumulator)

        const first = node.arguments.at(0)
        let copies = false

        if (method.name === 'assign' && isGlobalCopyOwner(context.sourceCode, method.object, 'Object')) {
          copies =
            first !== undefined &&
            first.type !== 'SpreadElement' &&
            arrayMethodUnwrap(first).type === 'ObjectExpression' &&
            node.arguments.slice(1).some(isAccumulator)
        } else if (method.name === 'from' && isGlobalCopyOwner(context.sourceCode, method.object, 'Array')) {
          copies = first !== undefined && isAccumulator(first)
        } else if (arrayCopies.has(method.name)) {
          const { initialValue } = reducer

          copies =
            initialValue !== undefined &&
            initialValue.type !== 'SpreadElement' &&
            arrayMethodIsKnownArray(context.sourceCode, initialValue) &&
            referencesAccumulator(context.sourceCode, method.object, accumulator)
        }

        if (copies) {
          context.report({ node, messageId: 'accumulatorCopy' })
        }
      },
    }
  },
})
