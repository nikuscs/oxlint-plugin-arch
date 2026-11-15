import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { namingCaptures, namingExpand } from '../../utils/naming.utils.ts'
import * as OptionsUtils from '../../utils/options.utils.ts'
import type { EffectServiceParamsOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

function effectServiceParamsKey(member: ESTree.TSSignature): string | undefined {
  if ((member.type !== 'TSPropertySignature' && member.type !== 'TSMethodSignature') || member.computed) {
    return undefined
  }

  return member.key.type === 'Identifier' ? member.key.name : undefined
}

function effectServiceParamsTypeName(name: ESTree.TSTypeName): string {
  if (name.type === 'TSQualifiedName') {
    return `${effectServiceParamsTypeName(name.left)}.${name.right.name}`
  }

  return name.type === 'Identifier' ? name.name : 'this'
}

export const effectServiceParams = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: OptionsUtils.optionsPatternSchema,
          allow: OptionsUtils.optionsPatternSchema,
          declaration: { type: 'string', minLength: 1 },
        },
      },
    ],
    messages: {
      name: "'{{path}}' takes '{{type}}'; a service method takes a params type that matches {{pattern}}.",
      inline: "'{{path}}' takes an unnamed type; a service method takes a params type that matches {{pattern}}.",
    },
  },
  createOnce(context) {
    let options: EffectServiceParamsOptions = {}
    let captures: Record<string, string> = {}
    let allowed: RegExp[] = []

    function checkParams(params: ESTree.ParamPattern[], keys: string[]): void {
      const first = params.at(0)
      const annotation = first && 'typeAnnotation' in first ? first.typeAnnotation?.typeAnnotation : undefined

      if (!first || !annotation) {
        return
      }

      const values = { ...captures, path: keys.join('-'), key: keys.at(-1) ?? '' }
      const sources = [options.name ?? '^{Folder}\\w*Params$'].flat().map((source) => namingExpand(source, values, true, OptionsUtils.optionsEscape))
      const data = { path: keys.join('.'), pattern: OptionsUtils.optionsPatternLabel(sources) }

      if (annotation.type !== 'TSTypeReference') {
        context.report({
          node: first,
          messageId: 'inline',
          data,
        })

        return
      }

      const type = effectServiceParamsTypeName(annotation.typeName)
      const last = type.split('.').at(-1) ?? type

      if (!OptionsUtils.optionsPatternsTest(allowed, type) && !OptionsUtils.optionsPatternsTest(OptionsUtils.optionsPatterns(sources), last)) {
        context.report({
          node: first,
          messageId: 'name',
          data: { ...data, type },
        })
      }
    }

    function check(literal: ESTree.TSTypeLiteral, path: string[]): void {
      for (const member of literal.members) {
        const key = effectServiceParamsKey(member)
        const type = member.type === 'TSPropertySignature' ? member.typeAnnotation?.typeAnnotation : undefined

        if (key === undefined) {
          continue
        }

        if (member.type === 'TSMethodSignature') {
          checkParams(member.params, [...path, key])
        } else if (type?.type === 'TSFunctionType') {
          checkParams(type.params, [...path, key])
        } else if (type?.type === 'TSTypeLiteral') {
          check(type, [...path, key])
        }
      }
    }

    return {
      before() {
        options = OptionsUtils.optionsFirst<EffectServiceParamsOptions>(context, {})
        captures = namingCaptures(context.filename) ?? {}
        allowed = OptionsUtils.optionsPatterns(options.allow)
      },
      TSTypeLiteral(node) {
        const call = node.parent.type === 'TSTypeParameterInstantiation' ? node.parent.parent : undefined

        if (call?.type === 'CallExpression' && astDottedName(call.callee) === (options.declaration ?? 'Context.Service')) {
          check(node, [])
        }
      },
    }
  },
})
