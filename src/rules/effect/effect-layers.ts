import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  sourceIndentSchema,
  sourceIndentUnit,
  sourceItemGaps,
  sourceLineIndent,
  sourceNewline,
  sourceRespace,
} from '../../utils/source.utils.ts'
import type { EffectLayersOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

const effectLayersDefaultMerge = ['Layer.mergeAll']

const effectLayersDefaultProvide = ['Effect.provide', 'Layer.provide', 'Layer.provideMerge']

const effectLayersDefaultMin = 2

const effectLayersGroupSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    callees: { type: 'array', items: { type: 'string' } },
    min: { type: 'integer', minimum: 1 },
  },
}

export const effectLayers = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          merge: effectLayersGroupSchema,
          provide: effectLayersGroupSchema,
          indent: sourceIndentSchema,
        },
      },
    ],
    messages: {
      merge: 'Put every layer in this merge on its own line.',
      provide: 'Put every layer in this array on its own line.',
    },
  },
  createOnce(context) {
    let merge = new Set(effectLayersDefaultMerge)
    let provide = new Set(effectLayersDefaultProvide)
    let mergeMin = effectLayersDefaultMin
    let provideMin = effectLayersDefaultMin
    let indentUnit = sourceIndentUnit()

    const check = (node: ESTree.CallExpression | ESTree.ArrayExpression) => {
      const source = context.sourceCode
      const call = node.type === 'CallExpression'
      const items: readonly (ESTree.CallExpression['arguments'][number] | null)[] = call ? node.arguments : node.elements
      const present = items.filter((item) => item !== null)
      const open = call ? source.getTokenAfter(node.typeArguments ?? node.callee) : source.getFirstToken(node)
      const close = source.getLastToken(node)

      if (open?.value !== (call ? '(' : '[') || close === null || present.length < (call ? mergeMin : provideMin)) {
        return
      }

      const packed = [open, ...present].some((item, index) => item.loc.end.line === (present.at(index) ?? close).loc.start.line)

      if (!packed) {
        return
      }

      const text = source.text
      const newline = sourceNewline(text)
      const base = sourceLineIndent(text, open.range[0])
      const gaps = sourceItemGaps(open.range[1], present, close.range[0])

      context.report({
        node,
        messageId: call ? 'merge' : 'provide',
        fix: (fixer) => {
          if (present.length !== items.length) {
            return null
          }

          return sourceRespace(fixer, text, gaps, (_, end) => `${newline}${base}${end ? '' : indentUnit}`)
        },
      })
    }

    return {
      before() {
        const options = optionsFirst<EffectLayersOptions>(context, {})
        merge = new Set(options.merge?.callees ?? effectLayersDefaultMerge)
        provide = new Set(options.provide?.callees ?? effectLayersDefaultProvide)
        mergeMin = options.merge?.min ?? effectLayersDefaultMin
        provideMin = options.provide?.min ?? effectLayersDefaultMin
        indentUnit = sourceIndentUnit(options.indent)
      },
      CallExpression(node) {
        const name = astDottedName(node.callee)

        if (name !== undefined && merge.has(name)) {
          check(node)
        }

        if (name !== undefined && provide.has(name)) {
          for (const argument of node.arguments) {
            if (argument.type === 'ArrayExpression') {
              check(argument)
            }
          }
        }
      },
    }
  },
})
