import { defineRule } from '@oxlint/plugins'
import { astDeclaration, astDottedName, astSome } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { EffectSchemaFirstOptions, EffectSchemaFirstSection } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

const effectSchemaFirstDefaultRuntime = [
  'Effect', 'Layer', 'Stream', 'Context', 'Scope', 'Kysely', 'React', 'Fiber', 'Queue', 'PubSub', 'Ref', 'Deferred', 'ManagedRuntime', 'Sink',
  'Channel', 'Request', 'Response', 'Headers', 'ReadableStream', 'WritableStream', 'Blob', 'File', 'AbortSignal', 'WebSocket', 'Socket', 'Worker',
  'Uint8Array', 'ArrayBuffer', 'globalThis',
]

const effectSchemaFirstSections = {
  values: ['VariableDeclaration', 'ClassDeclaration'],
  interfaces: ['TSInterfaceDeclaration'],
  modules: ['TSModuleDeclaration'],
  aliases: ['TSTypeAliasDeclaration'],
} satisfies Record<EffectSchemaFirstSection, string[]>

const effectSchemaFirstLabels = {
  values: 'Schemas and values',
  interfaces: 'interfaces',
  modules: '`declare module`',
  aliases: 'type aliases',
} satisfies Record<EffectSchemaFirstSection, string>

const effectSchemaFirstDefaultOrder: NonNullable<EffectSchemaFirstOptions['order']> = ['values', ['interfaces', 'modules'], 'aliases']

const effectSchemaFirstSectionSchema = { type: 'string', enum: ['values', 'interfaces', 'modules', 'aliases'] }

function effectSchemaFirstTypeName(node: ESTree.Node): string | undefined {
  if (node.type === 'TSQualifiedName') {
    const left = effectSchemaFirstTypeName(node.left)
    return left === undefined ? undefined : `${left}.${node.right.name}`
  }

  return astDottedName(node)
}

function effectSchemaFirstReference(node: ESTree.Node): string | undefined {
  if (node.type === 'TSTypeReference') {
    return effectSchemaFirstTypeName(node.typeName)
  }

  if (node.type === 'TSTypeQuery') {
    return effectSchemaFirstTypeName(node.exprName)
  }

  return node.type === 'TSInterfaceHeritage' ? astDottedName(node.expression) : undefined
}

export const effectSchemaFirst = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          member: { type: 'string' },
          keep: optionsPatternSchema,
          runtime: { type: 'array', items: { type: 'string' } },
          rows: {
            type: 'object',
            additionalProperties: false,
            properties: { types: { type: 'array', items: { type: 'string' } }, suffix: { type: 'string' } },
          },
          order: {
            type: 'array',
            items: { anyOf: [effectSchemaFirstSectionSchema, { type: 'array', items: effectSchemaFirstSectionSchema, minItems: 1 }] },
          },
          derived: {
            type: 'object',
            additionalProperties: false,
            properties: { first: { type: 'boolean' }, sorted: { type: 'boolean' } },
          },
        },
      },
    ],
    messages: {
      order: 'Order a types file as {{order}}.',
      schemaType: 'Add `export type {{name}} = typeof {{name}}.{{member}}` to the final type block.',
      typeOrder: 'Move {{name}}: the type block lists the `typeof` aliases first, in Schema order, then the other aliases.',
      dataInterface: 'Every field of {{name}} fits a Schema: make it a Schema and derive its type.',
      rowItem: '{{name}} is built from a database row: make it a Schema; only a `…{{suffix}}` alias may read the row type.',
    },
  },
  createOnce(context) {
    let member = 'Type'
    let keep: RegExp[] = []
    let runtime = new Set(effectSchemaFirstDefaultRuntime)
    let rows: Set<string> | undefined
    let suffix = 'Record'
    let ranks = new Map<string, number>()
    let orderText = ''
    let derivedFirst = true
    let derivedSorted = true

    const derives = (alias: ESTree.TSTypeAliasDeclaration) => {
      const annotation = alias.typeAnnotation
      const name = annotation.type === 'TSTypeQuery' ? annotation.exprName : undefined

      return name?.type === 'TSQualifiedName' && name.left.type === 'Identifier' && name.left.name === alias.id.name && name.right.name === member
    }

    const refers = (node: ESTree.Node, names: ReadonlySet<string>) =>
      astSome(node, (child) => {
        if (child.type === 'TSFunctionType' || child.type === 'TSConstructorType' || child.type === 'TSMethodSignature') {
          return true
        }

        return (effectSchemaFirstReference(child)?.split('.') ?? []).some((name) => names.has(name))
      })

    const readsRow = (node: ESTree.Node) => astSome(node, (child) => Boolean(rows?.has(effectSchemaFirstReference(child) ?? '')))

    const checkOrder = (program: ESTree.Program) => {
      let highest = 0

      for (const statement of program.body) {
        const rank = ranks.get(astDeclaration(statement)?.type ?? '') ?? 0

        if (rank > 0 && rank < highest) {
          context.report({
            node: statement,
            messageId: 'order',
            data: { order: orderText },
          })
        }

        highest = Math.max(highest, rank)
      }
    }

    const keptNames = (program: ESTree.Program, aliases: ESTree.TSTypeAliasDeclaration[], interfaces: ESTree.TSInterfaceDeclaration[]) => {
      const kept = new Set(aliases.filter((alias) => refers(alias.typeAnnotation, runtime)).map((alias) => alias.id.name))

      for (const statement of program.body) {
        if (statement.type === 'ImportDeclaration' && statement.source.value.startsWith('.')) {
          for (const specifier of statement.specifiers) {
            if (statement.importKind === 'type' || (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')) {
              kept.add(specifier.local.name)
            }
          }
        }
      }

      const names = new Set([...runtime, ...kept])
      let grew = true

      while (grew) {
        grew = false

        for (const node of interfaces) {
          const stays = node.body.body.length === 0 || Boolean(node.typeParameters) || optionsPatternsTest(keep, node.id.name) || refers(node, names)

          if (!kept.has(node.id.name) && stays) {
            names.add(node.id.name)
            kept.add(node.id.name)
            grew = true
          }
        }
      }

      return kept
    }

    return {
      before() {
        const options = optionsFirst<EffectSchemaFirstOptions>(context, {})
        member = options.member ?? 'Type'
        keep = optionsPatterns(options.keep)
        runtime = new Set(options.runtime ?? effectSchemaFirstDefaultRuntime)
        rows = options.rows ? new Set(options.rows.types ?? ['Kysely.Selectable']) : undefined
        suffix = options.rows?.suffix ?? 'Record'
        const order = (options.order ?? effectSchemaFirstDefaultOrder).map((group) => [group].flat())
        ranks = new Map(
          order.flatMap((group, index) => group.flatMap((section) => effectSchemaFirstSections[section].map((type) => [type, index + 1] as const))),
        )
        orderText = order.map((group) => group.map((section) => effectSchemaFirstLabels[section]).join(' and ')).join(', then ')
        derivedFirst = options.derived?.first ?? true
        derivedSorted = options.derived?.sorted ?? true
      },
      Program(program) {
        checkOrder(program)

        const declarations = program.body.flatMap((statement) => astDeclaration(statement) ?? [])
        const aliases = declarations.filter((node) => node.type === 'TSTypeAliasDeclaration')
        const interfaces = declarations.filter((node) => node.type === 'TSInterfaceDeclaration')
        const schemas = declarations.flatMap((node) => (node.type === 'VariableDeclaration' ? node.declarations : [])).map(({ id }) => (id.type === 'Identifier' ? id.name : ''))
        const exported = program.body.flatMap((statement) => (statement.type === 'ExportNamedDeclaration' && statement.declaration ? [statement.declaration] : []))
        const typed = new Set(exported.flatMap((node) => (node.type === 'TSTypeAliasDeclaration' && derives(node) ? [node.id.name] : [])))

        for (const node of exported.flatMap((declaration) => (declaration.type === 'VariableDeclaration' ? declaration.declarations : []))) {
          const isSchema = node.init?.type === 'CallExpression' || node.init?.type === 'MemberExpression'

          if (isSchema && node.id.type === 'Identifier' && !typed.has(node.id.name)) {
            context.report({
              node,
              messageId: 'schemaType',
              data: { name: node.id.name, member },
            })
          }
        }

        let order = -1
        let other = false

        for (const alias of aliases) {
          if (!derives(alias)) {
            other = true
            continue
          }

          const index = schemas.indexOf(alias.id.name)

          if ((derivedFirst && other) || (derivedSorted && index < order)) {
            context.report({
              node: alias,
              messageId: 'typeOrder',
              data: { name: alias.id.name },
            })
          }

          order = Math.max(order, index)
        }

        const kept = keptNames(program, aliases, interfaces)

        for (const node of interfaces) {
          if (!kept.has(node.id.name)) {
            context.report({
              node,
              messageId: 'dataInterface',
              data: { name: node.id.name },
            })
          }
        }

        for (const node of rows ? declarations : []) {
          const fromRow =
            (node.type === 'TSTypeAliasDeclaration' && !node.id.name.endsWith(suffix) && readsRow(node.typeAnnotation)) ||
            (node.type === 'TSInterfaceDeclaration' && node.extends.some(readsRow))

          if (fromRow) {
            context.report({
              node,
              messageId: 'rowItem',
              data: { name: node.id.name, suffix },
            })
          }
        }
      },
    }
  },
})
