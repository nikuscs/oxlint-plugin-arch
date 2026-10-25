import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { SchemasRederiveOptions } from '../../types/schemas.types.ts'

export const schemasRederive = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          from: { type: 'array', items: { type: 'string' } },
          namespaces: { type: 'array', items: { type: 'string' } },
          operators: { type: 'array', items: { type: 'string' } },
        },
        required: ['from'],
      },
    ],
    messages: {
      rederive: 'Do not derive {{operator}} from imported schema {{schema}}; import its DTO type.',
    },
  },
  createOnce(context) {
    let imported = new Set<string>()
    let namespaces = new Set<string>()
    let operators = new Set<string>()

    return {
      Program(program) {
        const { from, namespaces: namespaceNames = ['z'], operators: operatorNames = ['infer', 'input'] } = optionsFirst<SchemasRederiveOptions>(context)
        namespaces = new Set(namespaceNames)
        operators = new Set(operatorNames)
        imported = new Set(
          program.body.flatMap((statement) =>
            statement.type === 'ImportDeclaration' && from.includes(statement.source.value)
              ? statement.specifiers.map((specifier) => specifier.local.name)
              : [],
          ),
        )
      },
      TSTypeReference(node) {
        const parameter = node.typeArguments?.params[0]

        if (
          node.typeName.type !== 'TSQualifiedName' ||
          node.typeName.left.type !== 'Identifier' ||
          !namespaces.has(node.typeName.left.name) ||
          !operators.has(node.typeName.right.name) ||
          parameter?.type !== 'TSTypeQuery' ||
          parameter.exprName.type !== 'Identifier' ||
          !imported.has(parameter.exprName.name)
        ) {
          return
        }
        context.report({
          node,
          messageId: 'rederive',
          data: { operator: node.typeName.right.name, schema: parameter.exprName.name },
        })
      },
    }
  },
})
