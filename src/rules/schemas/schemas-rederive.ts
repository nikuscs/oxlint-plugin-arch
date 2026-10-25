import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { schemasTypeOperator } from '../../utils/schemas.utils.ts'
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

    return {
      Program(program) {
        const { from } = optionsFirst<SchemasRederiveOptions>(context)
        imported = new Set(
          program.body.flatMap((statement) =>
            statement.type === 'ImportDeclaration' && from.includes(statement.source.value)
              ? statement.specifiers.map((specifier) => specifier.local.name)
              : [],
          ),
        )
      },
      TSTypeReference(node) {
        const { namespaces = ['z'], operators = ['infer', 'input'] } = optionsFirst<SchemasRederiveOptions>(context)
        const operator = schemasTypeOperator(node, new Set(namespaces), new Set(operators))
        const parameter = node.typeArguments?.params[0]

        if (!operator || parameter?.type !== 'TSTypeQuery' || parameter.exprName.type !== 'Identifier') {
          return
        }

        if (!imported.has(parameter.exprName.name)) {
          return
        }
        context.report({
          node,
          messageId: 'rederive',
          data: { operator, schema: parameter.exprName.name },
        })
      },
    }
  },
})
