import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { namingCaptures, namingCaptureSchemaProperties, namingExpand, namingKeyPath } from '../../utils/naming.utils.ts'
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
          values: OptionsUtils.optionsPatternSchema,
          params: { type: 'integer', minimum: 0 },
          message: { type: 'string' },
          ...namingCaptureSchemaProperties,
        },
      },
    ],
    messages: {
      name: "'{{path}}' takes '{{type}}'; a service method takes a params type that matches {{pattern}}.{{message}}",
      inline: "'{{path}}' takes an unnamed type; a service method takes a params type that matches {{pattern}}.{{message}}",
      value: "'{{path}}' is typed '{{type}}'; a service member is a function, so a read without input takes no parameters.{{message}}",
      params: "'{{path}}' takes {{count}} parameters; a service method takes at most {{max}}.{{message}}",
    },
  },
  createOnce(context) {
    let options: EffectServiceParamsOptions = {}
    let captures: Record<string, string> = {}
    let allowed: RegExp[] = []
    let values: RegExp[] = []

    function reportMessage(keys: string[]): string {
      return OptionsUtils.optionsMessage(options.message && namingExpand(options.message, namingKeyPath(captures, keys), true))
    }

    function checkParams(node: ESTree.Node, params: ESTree.ParamPattern[], keys: string[]): void {
      if (options.params !== undefined && params.length > options.params) {
        context.report({
          node,
          messageId: 'params',
          data: { path: keys.join('.'), count: String(params.length), max: String(options.params), message: reportMessage(keys) },
        })
      }

      const first = params.at(0)
      const annotation = first && 'typeAnnotation' in first ? first.typeAnnotation?.typeAnnotation : undefined

      if (!first || !annotation) {
        return
      }

      const sources = [options.name ?? '^{Folder}\\w*Params$'].flat().map((source) => namingExpand(source, namingKeyPath(captures, keys), true, OptionsUtils.optionsEscape))
      const data = { path: keys.join('.'), pattern: OptionsUtils.optionsPatternLabel(sources), message: reportMessage(keys) }

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
          checkParams(member, member.params, [...path, key])
        } else if (type?.type === 'TSFunctionType') {
          checkParams(member, type.params, [...path, key])
        } else if (type?.type === 'TSTypeLiteral') {
          check(type, [...path, key])
        } else if (type?.type === 'TSTypeReference' && OptionsUtils.optionsPatternsTest(values, effectServiceParamsTypeName(type.typeName))) {
          context.report({
            node: member,
            messageId: 'value',
            data: { path: [...path, key].join('.'), type: effectServiceParamsTypeName(type.typeName), message: reportMessage([...path, key]) },
          })
        }
      }
    }

    return {
      before() {
        options = OptionsUtils.optionsFirst<EffectServiceParamsOptions>(context, {})
        allowed = OptionsUtils.optionsPatterns(options.allow)
        values = OptionsUtils.optionsPatterns(options.values)
        const paths = namingCaptures(context.filename, options)

        if (!paths) {
          return false
        }

        captures = paths
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
