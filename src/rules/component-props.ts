import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import {
  astCallName,
  astVisit,
  exportsCollect,
  namingFileBasename,
  namingFileStem,
  namingNormalized,
  namingPascalCase,
  optionsFirst,
  reactComponentsIsLike,
} from '../utils/index.ts'
import type { AstRuntimeFunction, ReactComponentsCandidate } from '../utils/index.ts'

interface ComponentPropsOptions {
  filePrefix?: boolean
}

interface ComponentPropsTopLevel {
  candidate: ReactComponentsCandidate
  index: number
}

interface ComponentPropsTarget {
  fn: AstRuntimeFunction
  typeArgument?: ESTree.TSType
}

function unwrapExport(statement: ESTree.Statement | ESTree.Directive | ESTree.ModuleDeclaration) {
  return statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
    ? statement.declaration
    : statement
}

function topLevelComponents(program: ESTree.Program): ComponentPropsTopLevel[] {
  return program.body.flatMap((statement, index): ComponentPropsTopLevel[] => {
    const declaration = unwrapExport(statement)

    if (declaration?.type === 'FunctionDeclaration' && declaration.id) {
      return [{ candidate: { name: declaration.id.name, node: declaration, declaration }, index }]
    }

    if (declaration?.type !== 'VariableDeclaration') {
      return []
    }

    return declaration.declarations.flatMap((item) =>
      item.id.type === 'Identifier'
        ? [{ candidate: { name: item.id.name, node: item, declaration, initializer: item.init }, index }]
        : [],
    )
  })
}

function propsTarget(node: ESTree.Node | null | undefined): ComponentPropsTarget | undefined {
  if (node?.type === 'FunctionDeclaration' || node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression') {
    return { fn: node }
  }

  if (node?.type !== 'CallExpression') {
    return undefined
  }

  const name = astCallName(node)
  const inner = name === 'memo' || name === 'forwardRef' ? propsTarget(node.arguments[0]) : undefined
  const typeArgument = name === 'forwardRef' ? node.typeArguments?.params[1] : undefined
  return inner && typeArgument ? { ...inner, typeArgument } : inner
}

function parameterType(parameter: ESTree.ParamPattern | undefined): ESTree.TSType | undefined {
  if (parameter?.type === 'AssignmentPattern') {
    return parameterType(parameter.left)
  }

  return parameter && parameter.type !== 'TSParameterProperty' ? parameter.typeAnnotation?.typeAnnotation : undefined
}

function containsTypeLiteral(node: ESTree.Node): boolean {
  let found = false
  astVisit(node, [], (candidate) => {
    found ||= candidate.type === 'TSTypeLiteral'
  })

  return found
}

function isPassThrough(type: ESTree.TSType): boolean {
  if (type.type !== 'TSTypeReference') {
    return false
  }

  const { typeName } = type
  const name = typeName.type === 'TSQualifiedName' ? typeName.right.name : typeName.type === 'Identifier' ? typeName.name : ''
  const argument = type.typeArguments?.params.length === 1 ? type.typeArguments.params[0] : undefined
  return (
    name === 'ComponentProps' &&
    (argument?.type === 'TSTypeQuery' ||
      (argument?.type === 'TSLiteralType' && argument.literal.type === 'Literal' && typeof argument.literal.value === 'string'))
  )
}

/**
 * Requires every top-level React component with props to use `interface <Component>Props`, declared directly above it.
 * Inline object types always fail. A component adding no props may take a plain `ComponentProps<'tag'>` or `ComponentProps<typeof X>`.
 * `memo` and `forwardRef` are unwrapped. With `filePrefix`, local components must start with the filename prefix so their props interface does too.
 *
 * Example: `interface CardProps { title: string }` followed by `export function Card({ title }: CardProps)` passes; `{ title }: { title: string }` fails.
 */
export const componentProps = defineRule({
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
      rename:
        "Local component '{{name}}' would need `interface {{expected}}`, which breaks the file prefix '{{prefix}}'. Rename the component to start with '{{prefix}}' (for example '{{prefix}}Item').",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { filePrefix = false } = optionsFirst<ComponentPropsOptions>(context, {})
        const stem = namingFileStem(namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, ''))
        const exported = new Set(exportsCollect(program).flatMap((binding) => (binding.typeOnly ? [] : [binding.localName])))
        const interfaces = new Map(
          program.body.flatMap((statement, index): [string, number][] => {
            const declaration = unwrapExport(statement)
            return declaration?.type === 'TSInterfaceDeclaration' ? [[declaration.id.name, index]] : []
          }),
        )

        for (const { candidate, index } of topLevelComponents(program)) {
          const target = propsTarget(candidate.initializer ?? candidate.declaration)
          const parameter = target?.fn.params[0]

          if (!target || !parameter || !reactComponentsIsLike(program, candidate)) {
            continue
          }

          const type = target.typeArgument ?? parameterType(parameter)
          const expected = `${candidate.name}Props`
          const data = { name: candidate.name, expected }

          if (
            filePrefix &&
            !exported.has(candidate.name) &&
            !candidate.name.toLowerCase().startsWith(namingNormalized(stem, 'remove-separators'))
          ) {
            context.report({ node: candidate.node, messageId: 'rename', data: { ...data, prefix: namingPascalCase(stem) } })
            continue
          }

          if (type && containsTypeLiteral(type)) {
            context.report({ node: type, messageId: 'inline', data })
            continue
          }

          if (type && isPassThrough(type)) {
            continue
          }

          const declared = interfaces.get(expected)

          if (
            declared === undefined ||
            type?.type !== 'TSTypeReference' ||
            type.typeName.type !== 'Identifier' ||
            type.typeName.name !== expected
          ) {
            context.report({
              node: type ?? parameter,
              messageId: 'name',
              data: { ...data, actual: type ? context.sourceCode.getText(type) : 'untyped' },
            })
            continue
          }

          const previous = program.body[declared]
          const statement = program.body[index]
          const between = previous && statement ? context.sourceCode.text.slice(previous.range[1], statement.range[0]) : ''

          if (declared !== index - 1 || between.trim() !== '') {
            context.report({ node: type, messageId: 'placement', data })
          }
        }
      },
    }
  },
})
