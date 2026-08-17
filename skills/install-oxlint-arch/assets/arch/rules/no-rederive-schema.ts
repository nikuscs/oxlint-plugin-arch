import { defineRule } from '@oxlint/plugins'
import { optionsFirst, schemasTypeOperator } from '../utils/index.ts'

interface NoRederiveSchemaOptions {
  from: string[]
  namespaces?: string[]
  operators?: string[]
}

/**
 * Prevents deriving types from configured imported schemas when the package should export and consume a named type.
 *
 * Example: `z.infer<typeof importedSchema>` fails; deriving from a same-file schema passes.
 */
export const noRederiveSchema = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        from: { type: 'array', items: { type: 'string' } },
        namespaces: { type: 'array', items: { type: 'string' } },
        operators: { type: 'array', items: { type: 'string' } },
      },
      required: ['from'],
    }],
    messages: {
      rederive: 'Do not derive {{operator}} from imported schema {{schema}}; import its DTO type.',
    },
  },
  createOnce(context) {
    let imported = new Set<string>()

    return {
      Program(program) {
        const { from } = optionsFirst<NoRederiveSchemaOptions>(context)
        imported = new Set(program.body.flatMap((statement) => statement.type === 'ImportDeclaration'
          && from.includes(statement.source.value)
          ? statement.specifiers.map((specifier) => specifier.local.name)
          : []))
      },
      TSTypeReference(node) {
        const {
          namespaces = ['z'],
          operators = ['infer', 'input'],
        } = optionsFirst<NoRederiveSchemaOptions>(context)
        const operator = schemasTypeOperator(node, new Set(namespaces), new Set(operators))
        const parameter = node.typeArguments?.params[0]

        if (!operator
          || parameter?.type !== 'TSTypeQuery'
          || parameter.exprName.type !== 'Identifier'
          || !imported.has(parameter.exprName.name)) {
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
