import { defineRule } from '@oxlint/plugins'
import { astCallName, astIsInlineFunction, astSome, astStaticString } from '../../utils/ast.utils.ts'
import { boundariesDeclaredVariable } from '../../utils/boundaries.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { AstFunction } from '../../types/ast.types.ts'
import type { ReactQueryPropsOptions } from '../../types/react.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const reactQueryProps = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          hooks: { type: 'array', items: { type: 'string' } },
          functions: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    messages: {
      options: 'Build the {{hook}} options here from props; ready-made options hide where the data comes from.',
      source: '{{key}} must be a prop or call one; pass the data function in from the app.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const { hooks = ['useQuery', 'useMutation', 'useInfiniteQuery', 'useSuspenseQuery'], functions = ['queryFn', 'mutationFn'] } = optionsFirst<ReactQueryPropsOptions>(context, {})
        const hook = astCallName(node)
        let owner: ESTree.Node | null = node.parent

        while (owner && owner.type !== 'FunctionDeclaration' && !astIsInlineFunction(owner)) {
          owner = owner.parent
        }

        if (!hook || !hooks.includes(hook) || !owner || (owner.type !== 'FunctionDeclaration' && !astIsInlineFunction(owner))) {
          return
        }

        const component: AstFunction = owner
        const first = component.params.at(0)
        const parameter = first?.type === 'AssignmentPattern' ? first.left : first

        const definition = (identifier: ESTree.Node & { name: string }) =>
          boundariesDeclaredVariable(context.sourceCode.getScope(identifier), identifier.name)?.defs.at(0)

        const isProps = (value: ESTree.Node | null | undefined) => {
          const found = value?.type === 'Identifier' ? definition(value) : undefined

          return found?.type === 'Parameter' && found.node === component && parameter?.type === 'Identifier'
        }

        const isProp = (value: ESTree.Node): boolean => {
          if (value.type === 'MemberExpression') {
            return isProps(value.object)
          }

          const found = value.type === 'Identifier' ? definition(value) : undefined

          if (found?.type === 'Parameter') {
            return found.node === component && parameter?.type === 'ObjectPattern'
          }

          return found?.type === 'Variable' && found.node.type === 'VariableDeclarator' && found.node.id.type === 'ObjectPattern' && isProps(found.node.init)
        }

        const options = node.arguments.at(0)

        if (options?.type !== 'ObjectExpression' || options.properties.some((property) => property.type === 'SpreadElement')) {
          context.report({
            node: options ?? node,
            messageId: 'options',
            data: { hook },
          })
          return
        }

        for (const property of options.properties) {
          if (property.type !== 'Property') {
            continue
          }

          const key = property.key.type === 'Identifier' && !property.computed ? property.key.name : astStaticString(property.key)

          if (key === undefined || !functions.includes(key)) {
            continue
          }

          const { value } = property
          const calls = astIsInlineFunction(value) && astSome(value.body, (child) => child.type === 'CallExpression' && isProp(child.callee))

          if (!isProp(value) && !calls) {
            context.report({
              node: value,
              messageId: 'source',
              data: { key },
            })
          }
        }
      },
    }
  },
})
