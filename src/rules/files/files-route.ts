import { defineRule } from '@oxlint/plugins'
import {
  declarationsTopLevelUnexportedFunctions,
  exportsCollect,
  exportsCollectFunctions,
  optionsFirst,
  routesInspectFunction,
} from '../../utils/index.ts'

interface RouteSurfaceOptions {
  exportName: string
  allowedExports?: string[]
  inspectExports?: boolean
  bannedHooks: string[]
  banIntrinsicJsx: boolean
}

/**
 * Keeps route files on a small configurable surface: one export plus adapters without banned hooks or intrinsic JSX.
 * `allowedExports` admits framework metadata exports; `inspectExports` also checks the exported route component.
 *
 * Example: A route rendering `<UserPage />` passes; an adapter rendering `<div>` or calling `useState` fails.
 */
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
          optionsFirst<RouteSurfaceOptions>(context)
        const allowed = new Set([exportName, ...allowedExports])
        const bindings = exportsCollect(program)

        for (const binding of bindings) {
          if (!allowed.has(binding.exportedName)) {
            context.report({
              node: binding.node,
              messageId: 'extraExport',
              data: { expected: [...allowed].join("', '"), actual: binding.exportedName },
            })
          }
        }

        const banned = new Set(bannedHooks)
        const inspected = new Set<number>()

        for (const item of declarationsTopLevelUnexportedFunctions(program)) {
          inspected.add(item.node.start)
          routesInspectFunction(context, item, banned, banIntrinsicJsx)
        }

        if (!inspectExports) return

        const names = new Set(
          bindings.filter((binding) => binding.exportedName === exportName).map((binding) => binding.localName ?? binding.exportedName),
        )

        const defaultExport = program.body.find((statement) => statement.type === 'ExportDefaultDeclaration')
        const declaration = defaultExport?.declaration
        const defaultFunctions =
          declaration?.type === 'ArrowFunctionExpression' || declaration?.type === 'FunctionExpression'
            ? [{ name: 'default', node: declaration }]
            : []

        for (const item of [...exportsCollectFunctions(program), ...defaultFunctions]) {
          if (names.has(item.name) && !inspected.has(item.node.start)) routesInspectFunction(context, item, banned, banIntrinsicJsx)
        }
      },
    }
  },
})
