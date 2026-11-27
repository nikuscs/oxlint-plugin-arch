import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsInlineFunction, astReturnExpressions, astSome, astStaticString, astUnwrap } from '../../utils/ast.utils.ts'
import { declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { namingCaptures, namingCaptureSchemaProperties, namingExpand, namingKeyPath } from '../../utils/naming.utils.ts'
import * as OptionsUtils from '../../utils/options.utils.ts'
import type { AstFunction } from '../../types/ast.types.ts'
import type { NamingKeysOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

function namingKeysNames(value: ESTree.Node): string[] {
  const dotted = astDottedName(value)

  return dotted === undefined ? [] : [...new Set([dotted.split('.').at(-1) ?? dotted, dotted.split('.')[0]])]
}

function namingKeysSingular(key: string, options: NamingKeysOptions): string[] {
  return options.singularize === 'trailing-s' && key.length > 1 && key.endsWith('s') ? [key, key.slice(0, -1)] : [key]
}

function namingKeysSources(options: NamingKeysOptions, captures: Record<string, string>, keys: string[]): string[] {
  const last = keys.at(-1) ?? ''

  return [options.name ?? []].flat().flatMap((source) =>
    namingKeysSingular(last, options).map((key) => namingExpand(source, namingKeyPath(captures, keys, key), true, OptionsUtils.optionsEscape)),
  )
}

function namingKeysFunction(value: ESTree.Node): AstFunction | undefined {
  if (astIsInlineFunction(value)) {
    return value
  }

  return value.type === 'CallExpression' ? (value.arguments.find(astIsInlineFunction) ?? namingKeysFunction(value.callee)) : undefined
}

function namingKeysYielded(node: ESTree.Node): ESTree.CallExpression | undefined {
  let found: ESTree.CallExpression | undefined

  astSome(node, (candidate) => {
    const call = candidate.type === 'YieldExpression' && candidate.delegate && candidate.argument ? astUnwrap(candidate.argument) : undefined

    found ??= call?.type === 'CallExpression' ? call : undefined

    return found !== undefined
  })

  return found
}

function namingKeysAssigned(fn: AstFunction, returned: ESTree.Node): ESTree.CallExpression | undefined {
  let found: ESTree.CallExpression | undefined

  astSome(fn.body, (candidate) => {
    const local = candidate.type === 'VariableDeclarator' && candidate.id.type === 'Identifier' && candidate.init ? candidate.id.name : undefined
    const used = local !== undefined && astSome(returned, (node) => node.type === 'Identifier' && node.name === local)

    found ??= used && candidate.type === 'VariableDeclarator' && candidate.init ? namingKeysYielded(candidate.init) : undefined

    return found !== undefined
  })

  return found
}

function namingKeysCalled(fn: AstFunction): string | undefined {
  const returned = astReturnExpressions(fn).at(-1)

  if (!returned) {
    return undefined
  }

  const plain = astUnwrap(returned)
  const direct = !fn.generator && plain.type === 'CallExpression' ? plain : undefined
  const call = namingKeysYielded(returned) ?? namingKeysAssigned(fn, returned) ?? direct

  return call ? astDottedName(call.callee) : undefined
}

export const namingKeys = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          callees: { type: 'array', items: { type: 'string' }, minItems: 1 },
          exports: OptionsUtils.optionsPatternSchema,
          name: OptionsUtils.optionsPatternSchema,
          keys: OptionsUtils.optionsPatternSchema,
          inline: { type: 'boolean' },
          calls: { type: 'boolean' },
          types: OptionsUtils.optionsPatternSchema,
          delegate: { type: 'boolean' },
          allow: OptionsUtils.optionsPatternSchema,
          ...namingCaptureSchemaProperties,
          message: { type: 'string' },
        },
        anyOf: [{ required: ['callees'] }, { required: ['exports'] }, { required: ['types'] }],
      },
    ],
    messages: {
      name: "'{{name}}' under key '{{path}}' must match {{pattern}}.{{message}}",
      key: "Key '{{key}}' in '{{path}}' must match {{pattern}}.{{message}}",
      inline: "Bind a named function under '{{path}}', not an inline one.{{message}}",
      call: "Bind '{{path}}' by reference, not the result of a call.{{message}}",
      delegate: "'{{path}}' must return a call to '{{path}}' on its service, not '{{called}}'.{{message}}",
    },
  },
  createOnce(context) {
    let options: NamingKeysOptions = {}
    let captures: Record<string, string> = {}
    let callees: RegExp[] = []
    let exported: RegExp[] = []
    let typed: RegExp[] = []
    let allowed: RegExp[] = []
    let keyPatterns: RegExp[] = []
    let message = ''

    function checkValue(value: ESTree.Node, keys: string[]): void {
      const path = keys.join('.')
      const fn = namingKeysFunction(value)
      const names = namingKeysNames(value)
      const sources = namingKeysSources(options, captures, keys)
      const called = options.delegate && fn ? namingKeysCalled(fn) : undefined

      if (fn && astIsInlineFunction(value) && options.inline === false) {
        context.report({
          node: value,
          messageId: 'inline',
          data: { path, message },
        })
      }

      if (!fn && options.calls === false && (value.type === 'CallExpression' || value.type === 'NewExpression')) {
        context.report({
          node: value,
          messageId: 'call',
          data: { path, message },
        })
      }

      if (called !== undefined && called.split('.').slice(1).join('.') !== path) {
        context.report({
          node: value,
          messageId: 'delegate',
          data: { path, called, message },
        })
      }

      if (sources.length > 0 && names.length > 0 && !names.some((name) => OptionsUtils.optionsPatternsTest(OptionsUtils.optionsPatterns(sources), name))) {
        context.report({
          node: value,
          messageId: 'name',
          data: { name: names[0], path, pattern: OptionsUtils.optionsPatternLabel(sources), message },
        })
      }
    }

    function checkKey(node: ESTree.Node, key: string, keys: string[]): void {
      if (keyPatterns.length > 0 && !OptionsUtils.optionsPatternsTest(keyPatterns, key)) {
        context.report({
          node,
          messageId: 'key',
          data: { key, path: keys.join('.'), pattern: OptionsUtils.optionsPatternLabel(options.keys), message },
        })
      }
    }

    function checkType(members: ESTree.TSSignature[], path: string[]): void {
      for (const member of members) {
        const plain = (member.type === 'TSPropertySignature' || member.type === 'TSMethodSignature') && !member.computed ? member.key : undefined
        const key = plain?.type === 'Identifier' ? plain.name : plain && astStaticString(plain)
        const keys = key === undefined ? path : [...path, key]
        const type = member.type === 'TSPropertySignature' ? member.typeAnnotation?.typeAnnotation : undefined

        if (!plain || key === undefined || OptionsUtils.optionsPatternsTest(allowed, keys.join('.'))) {
          continue
        }

        checkKey(plain, key, keys)

        if (type?.type === 'TSTypeLiteral') {
          checkType(type.members, keys)
        }
      }
    }

    function check(object: ESTree.ObjectExpression, path: string[]): void {
      for (const property of object.properties) {
        const key = declarationsPropertyName(property)
        const keys = key === undefined ? path : [...path, key]

        if (property.type !== 'Property' || key === undefined || OptionsUtils.optionsPatternsTest(allowed, keys.join('.'))) {
          continue
        }

        checkKey(property.key, key, keys)

        if (property.value.type === 'ObjectExpression') {
          check(property.value, keys)
        } else {
          checkValue(property.value, keys)
        }
      }
    }

    return {
      before() {
        options = OptionsUtils.optionsFirst<NamingKeysOptions>(context, {})
        const paths = namingCaptures(context.filename, { ...options, singularize: undefined })

        if (!paths) {
          return false
        }

        captures = paths
        message = OptionsUtils.optionsMessage(options.message)
        callees = OptionsUtils.optionsWildcards(options.callees)
        exported = OptionsUtils.optionsPatterns(options.exports)
        typed = OptionsUtils.optionsPatterns(options.types)
        allowed = OptionsUtils.optionsPatterns(options.allow)
        keyPatterns = OptionsUtils.optionsPatterns(options.keys)

        if (callees.length === 0 && exported.length === 0 && typed.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const first = node.arguments.at(0)

        if (first?.type === 'ObjectExpression' && OptionsUtils.optionsPatternsTest(callees, astDottedName(node.callee) ?? '')) {
          check(first, [])
        }
      },
      TSInterfaceDeclaration(node) {
        if (OptionsUtils.optionsPatternsTest(typed, node.id.name)) {
          checkType(node.body.body, [])
        }
      },
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation.type === 'TSTypeLiteral' && OptionsUtils.optionsPatternsTest(typed, node.id.name)) {
          checkType(node.typeAnnotation.members, [])
        }
      },
      VariableDeclarator(node) {
        const statement = node.parent.parent
        const top = statement?.type === 'ExportNamedDeclaration' && statement.parent.type === 'Program'
        const value = node.init ? astUnwrap(node.init) : null

        if (top && node.id.type === 'Identifier' && value?.type === 'ObjectExpression' && OptionsUtils.optionsPatternsTest(exported, node.id.name)) {
          check(value, [])
        }
      },
    }
  },
})
