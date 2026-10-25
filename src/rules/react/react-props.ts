import { defineRule } from '@oxlint/plugins'
import { astCallName, astDeclaration, astVisit } from '../../utils/ast.utils.ts'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { namingBasename, namingFileStem, namingNormalized, namingPascalCase } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { reactIsComponent } from '../../utils/react.utils.ts'
import type { ReactPropsComponent, ReactPropsOptions, ReactPropsTarget } from '../../types/react.types.ts'
import type { ESTree } from '@oxlint/plugins'

function reactPropsTarget(node: ESTree.Node | null | undefined): ReactPropsTarget | undefined {
  if (node?.type === 'FunctionDeclaration' || node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression') {
    return { fn: node }
  }

  if (node?.type !== 'CallExpression') {
    return undefined
  }

  const name = astCallName(node)
  const inner = name === 'memo' || name === 'forwardRef' ? reactPropsTarget(node.arguments[0]) : undefined
  const typeArgument = name === 'forwardRef' ? node.typeArguments?.params[1] : undefined
  return inner && typeArgument ? { ...inner, typeArgument } : inner
}

function reactParameterType(parameter: ESTree.ParamPattern | undefined): ESTree.TSType | undefined {
  if (parameter?.type === 'AssignmentPattern') {
    return reactParameterType(parameter.left)
  }
  return parameter && parameter.type !== 'TSParameterProperty' ? parameter.typeAnnotation?.typeAnnotation : undefined
}

function reactIsPassThrough(type: ESTree.TSType): boolean {
  if (type.type !== 'TSTypeReference') {
    return false
  }

  const name = type.typeName.type === 'TSQualifiedName' ? type.typeName.right : type.typeName
  const argument = type.typeArguments?.params.length === 1 ? type.typeArguments.params[0] : undefined
  return (
    name.type === 'Identifier' &&
    name.name === 'ComponentProps' &&
    (argument?.type === 'TSTypeQuery' ||
      (argument?.type === 'TSLiteralType' && argument.literal.type === 'Literal' && typeof argument.literal.value === 'string'))
  )
}

export const reactProps = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          filePrefix: { type: 'boolean' },
        },
      },
    ],
    messages: {
      inline: "'{{name}}' props are typed inline. Declare `interface {{expected}}` directly above it and use that.",
      name: "'{{name}}' props must use `interface {{expected}}` declared directly above it, not '{{actual}}'.",
      placement: "Move `interface {{expected}}` directly above '{{name}}', with only blank lines between them.",
      rename: "Local component '{{name}}' would need `interface {{expected}}`, which breaks the file prefix '{{prefix}}'. Rename the component to start with '{{prefix}}' (for example '{{prefix}}Item').",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { filePrefix = false } = optionsFirst<ReactPropsOptions>(context, {})
        const stem = namingFileStem(namingBasename(context.filename).replace(/\.(tsx?|jsx?)$/, ''))
        const prefix = namingNormalized(stem, 'remove-separators')
        const exported = new Set(exportsCollect(program).flatMap((binding) => (binding.typeOnly ? [] : [binding.localName])))

        const interfaces = new Map(
          program.body.flatMap((statement, index): [string, number][] => {
            const declaration = astDeclaration(statement)
            return declaration?.type === 'TSInterfaceDeclaration' ? [[declaration.id.name, index]] : []
          }),
        )

        const components = program.body.flatMap((statement, index): ReactPropsComponent[] => {
          const declaration = astDeclaration(statement)

          if (declaration?.type === 'FunctionDeclaration' && declaration.id) {
            return [{ candidate: { name: declaration.id.name, node: declaration, declaration }, index }]
          }

          if (declaration?.type !== 'VariableDeclaration') {
            return []
          }

          return declaration.declarations.flatMap((item) =>
            item.id.type === 'Identifier' ? [{ candidate: { name: item.id.name, node: item, declaration, initializer: item.init }, index }] : [],
          )
        })

        for (const { candidate, index } of components) {
          const target = reactPropsTarget(candidate.initializer ?? candidate.declaration)
          const parameter = target?.fn.params[0]

          if (!target || !parameter || !reactIsComponent(program, candidate)) {
            continue
          }

          const type = target.typeArgument ?? reactParameterType(parameter)
          const expected = `${candidate.name}Props`
          const data = { name: candidate.name, expected }

          if (filePrefix && !exported.has(candidate.name) && !candidate.name.toLowerCase().startsWith(prefix)) {
            context.report({
              node: candidate.node,
              messageId: 'rename',
              data: { ...data, prefix: namingPascalCase(stem) },
            })
            continue
          }

          const typeLiterals: ESTree.Node[] = []
          astVisit(type, [], (node) => {
            if (node.type === 'TSTypeLiteral') {
              typeLiterals.push(node)
            }
          })

          if (type && typeLiterals.length > 0) {
            context.report({
              node: type,
              messageId: 'inline',
              data,
            })
            continue
          }

          if (type && reactIsPassThrough(type)) {
            continue
          }

          const declared = interfaces.get(expected)

          if (declared === undefined || type?.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier' || type.typeName.name !== expected) {
            context.report({
              node: type ?? parameter,
              messageId: 'name',
              data: { ...data, actual: type ? context.sourceCode.getText(type) : 'untyped' },
            })
            continue
          }

          const between = context.sourceCode.text.slice(program.body[declared].range[1], program.body[index].range[0])

          if (declared !== index - 1 || between.trim() !== '') {
            context.report({
              node: type,
              messageId: 'placement',
              data,
            })
          }
        }
      },
    }
  },
})
