import { defineRule } from '@oxlint/plugins'
import { dictionaryTypesUnsafeDictionary, dictionaryTypesUnsafeValue } from '../shared/dictionary-types.ts'
import { typeBindingsAlias, typeBindingsWith } from '../shared/type-bindings.ts'
import { typeReferenceName } from '../shared/type-reference-name.ts'
import type { ESTree } from '@oxlint/plugins'

const typeNodeKinds: ReadonlySet<string> = new Set([
  'JSDocNonNullableType',
  'JSDocNullableType',
  'JSDocUnknownType',
  'TSAnyKeyword',
  'TSArrayType',
  'TSBigIntKeyword',
  'TSBooleanKeyword',
  'TSConditionalType',
  'TSConstructorType',
  'TSFunctionType',
  'TSImportType',
  'TSIndexedAccessType',
  'TSInferType',
  'TSIntersectionType',
  'TSIntrinsicKeyword',
  'TSLiteralType',
  'TSMappedType',
  'TSNamedTupleMember',
  'TSNeverKeyword',
  'TSNullKeyword',
  'TSNumberKeyword',
  'TSObjectKeyword',
  'TSParenthesizedType',
  'TSStringKeyword',
  'TSSymbolKeyword',
  'TSTemplateLiteralType',
  'TSThisType',
  'TSTupleType',
  'TSTypeLiteral',
  'TSTypeOperator',
  'TSTypePredicate',
  'TSTypeQuery',
  'TSTypeReference',
  'TSUndefinedKeyword',
  'TSUnionType',
  'TSUnknownKeyword',
  'TSVoidKeyword',
])

function isTypeNode(node: ESTree.Node): node is ESTree.TSType {
  return typeNodeKinds.has(node.type)
}

export const noUnsafeDictionaryTypeRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches.',
    },
    messages: {
      unsafeDictionary: "This dictionary's {{value}} value type gives callers no concrete value contract. Use an owner/schema-derived value type; parse external payloads before insertion.",
    },
  },
  createOnce(context) {
    const report = (node: ESTree.Node, value: string) => {
      context.report({
        node,
        messageId: 'unsafeDictionary',
        data: { value },
      })
    }

    return typeBindingsWith(context, (defer) => {
      const checkType = (node: ESTree.TSType) => {
        defer((environment) => {
          const unsafe = dictionaryTypesUnsafeDictionary(node, environment)

          if (unsafe === null) {
            return
          }

          const name = node.type === 'TSTypeReference' && !node.typeArguments?.params.length ? typeReferenceName(node) : null
          let aliasUse = name !== null && typeBindingsAlias(name, node, environment) !== null
          let child: ESTree.Node = node

          for (let current = node.parent; current.type !== 'Program'; current = current.parent) {
            if (
              (current.type === 'TSTypeParameter' && current.constraint === child) ||
              (isTypeNode(current) && dictionaryTypesUnsafeDictionary(current, environment) !== null)
            ) {
              return
            }
            aliasUse &&= current.type !== 'TSTypeAliasDeclaration'
            child = current
          }

          if (!aliasUse) {
            report(node, unsafe)
          }
        })
      }

      return {
        TSTypeReference: checkType,
        TSTypeLiteral: checkType,
        TSMappedType: checkType,
        TSIndexSignature(node) {
          if (node.parent.type === 'TSTypeLiteral') {
            return
          }
          defer((environment) => {
            const unsafe = dictionaryTypesUnsafeValue(node.typeAnnotation.typeAnnotation, environment)

            if (unsafe !== null) {
              report(node, unsafe)
            }
          })
        },
      }
    })
  },
})
