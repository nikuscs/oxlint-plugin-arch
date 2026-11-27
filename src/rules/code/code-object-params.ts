import { defineRule } from '@oxlint/plugins'
import { effectGenerator } from '../../utils/effect.utils.ts'
import { exportsCheckedFunctions, exportsCollect } from '../../utils/exports.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { CodeObjectParamsOptions } from '../../types/code.types.ts'
import type * as DeclarationsTypes from '../../types/declarations.types.ts'
import type { ESTree } from '@oxlint/plugins'

const codeObjectParamsBuilders = new Set(['Effect.fn', 'Effect.fnUntraced'])

function codeObjectParamsGenerators(program: ESTree.Program, all: boolean, allowed: RegExp[]): DeclarationsTypes.DeclarationsFunction[] {
  const exported = new Set(exportsCollect(program).map((binding) => binding.localName))

  return program.body.flatMap((statement) => {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement

    if (declaration?.type !== 'VariableDeclaration') {
      return []
    }

    return declaration.declarations.flatMap((item) => {
      const node = effectGenerator(item.init, codeObjectParamsBuilders)
      const name = item.id.type === 'Identifier' ? item.id.name : undefined

      return node && name && (all || exported.has(name)) && !optionsPatternsTest(allowed, name) ? [{ name, node }] : []
    })
  })
}

function isObjectParam(node: ESTree.ParamPattern): boolean {
  if (node.type === 'ObjectPattern') {
    return true
  }

  if (node.type === 'TSParameterProperty') {
    return isObjectParam(node.parameter)
  }

  if (node.type === 'AssignmentPattern') {
    return isObjectParam(node.left)
  }

  const annotation = node.typeAnnotation?.typeAnnotation
  return (
    !annotation ||
    annotation.type === 'TSTypeReference' ||
    annotation.type === 'TSTypeLiteral' ||
    annotation.type === 'TSIntersectionType'
  )
}

export const codeObjectParams = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: { type: 'integer', minimum: 1 },
          services: { type: 'boolean' },
          all: { type: 'boolean' },
          allow: optionsPatternSchema,
        },
      },
    ],
    messages: {
      objectParams: '{{label}} {{name}} must accept at most {{maxParams}} object parameter{{s}}.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          max: maxParams = 1,
          all: allDeclarations = false,
          services: serviceMethods = false,
          allow: allowPattern,
        } = optionsFirst<CodeObjectParamsOptions>(context, {})

        const allowed = optionsPatterns(allowPattern)

        const functions = [
          ...exportsCheckedFunctions(program, allDeclarations, serviceMethods, allowed),
          ...codeObjectParamsGenerators(program, allDeclarations, allowed),
        ]

        for (const { name, node } of functions) {
          if (node.params.length <= maxParams && node.params.every(isObjectParam)) {
            continue
          }
          context.report({
            node,
            messageId: 'objectParams',
            data: {
              label: allDeclarations ? 'Function' : 'Exported function',
              name,
              maxParams: maxParams === 1 ? 'one' : String(maxParams),
              s: maxParams === 1 ? '' : 's',
            },
          })
        }
      },
    }
  },
})
