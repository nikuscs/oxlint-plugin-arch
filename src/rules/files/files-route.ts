import { defineRule } from '@oxlint/plugins'
import { astCallName, astVisit } from '../../utils/ast.utils.ts'
import { declarationsTopLevelUnexportedFunctions } from '../../utils/declarations.utils.ts'
import { exportsCollect, exportsFunctions } from '../../utils/exports.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { DeclarationsFunction } from '../../types/declarations.types.ts'
import type { FilesRouteOptions } from '../../types/files.types.ts'
import type { Context } from '@oxlint/plugins'

function inspectAdapter(context: Context, item: DeclarationsFunction, bannedHooks: Set<string>, banIntrinsicJsx: boolean): void {
  astVisit(item.node.body, [item.node], (node) => {
    if (banIntrinsicJsx && node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && /^[a-z]/.test(node.name.name)) {
      context.report({
        node,
        messageId: 'hostJsx',
        data: { name: item.name },
      })
    }

    const hook = node.type === 'CallExpression' ? astCallName(node) : undefined

    if (hook && bannedHooks.has(hook)) {
      context.report({
        node,
        messageId: 'bannedHook',
        data: { hook, name: item.name },
      })
    }
  })
}

export const filesRoute = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          exportName: { type: 'string' },
          allowedExports: { type: 'array', items: { type: 'string' } },
          inspectExports: { type: 'boolean' },
          bannedHooks: { type: 'array', items: { type: 'string' } },
          banIntrinsicJsx: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [
      {
        exportName: 'Route',
        allowedExports: [],
        inspectExports: false,
        bannedHooks: ['useState', 'useEffect', 'useMutation'],
        banIntrinsicJsx: true,
      },
    ],
    messages: {
      extraExport: "Route files may only export '{{expected}}'; found '{{actual}}'.",
      hostJsx: 'Route adapter {{name}} must not render intrinsic JSX.',
      bannedHook: 'Route adapter {{name}} must not call {{hook}}.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { exportName, allowedExports = [], inspectExports = false, bannedHooks, banIntrinsicJsx } =
          optionsFirst<FilesRouteOptions>(context)

        const allowed = new Set([exportName, ...allowedExports])
        const expected = [...allowed].join("', '")
        const bindings = exportsCollect(program)

        for (const binding of bindings) {
          if (!allowed.has(binding.exportedName)) {
            context.report({
              node: binding.node,
              messageId: 'extraExport',
              data: { expected, actual: binding.exportedName },
            })
          }
        }

        const banned = new Set(bannedHooks)
        const inspected = new Set<number>()

        for (const item of declarationsTopLevelUnexportedFunctions(program)) {
          inspected.add(item.node.start)
          inspectAdapter(context, item, banned, banIntrinsicJsx)
        }

        if (!inspectExports) {
          return
        }

        const routeNames = new Set(
          bindings.filter((binding) => binding.exportedName === exportName).map((binding) => binding.localName ?? binding.exportedName),
        )

        const defaultExport = program.body.find((statement) => statement.type === 'ExportDefaultDeclaration')?.declaration

        const defaultFunctions: DeclarationsFunction[] =
          defaultExport?.type === 'ArrowFunctionExpression' || defaultExport?.type === 'FunctionExpression'
            ? [{ name: 'default', node: defaultExport }]
            : []

        for (const item of [...exportsFunctions(program), ...defaultFunctions]) {
          if (routeNames.has(item.name) && !inspected.has(item.node.start)) {
            inspectAdapter(context, item, banned, banIntrinsicJsx)
          }
        }
      },
    }
  },
})
