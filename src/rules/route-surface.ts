import { defineRule } from '@oxlint/plugins'
import {
  declarationsTopLevelUnexportedFunctions,
  exportsCollect,
  optionsFirst,
  routesInspectFunction,
} from '../utils/index.ts'

interface RouteSurfaceOptions {
  exportName: string
  bannedHooks: string[]
  banIntrinsicJsx: boolean
}

/**
 * Keeps route files on a small configurable surface: one export plus adapters without banned hooks or intrinsic JSX.
 *
 * Example: A route rendering `<UserPage />` passes; an adapter rendering `<div>` or calling `useState` fails.
 */
export const routeSurface = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        exportName: { type: 'string' },
        bannedHooks: { type: 'array', items: { type: 'string' } },
        banIntrinsicJsx: { type: 'boolean' },
      },
    }],
    defaultOptions: [{ exportName: 'Route', bannedHooks: ['useState', 'useEffect', 'useMutation'], banIntrinsicJsx: true }],
    messages: {
      extraExport: "Route files may only export '{{expected}}'; found '{{actual}}'.",
      hostJsx: 'Route adapter {{name}} must not render intrinsic JSX.',
      bannedHook: 'Route adapter {{name}} must not call {{hook}}.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { exportName, bannedHooks, banIntrinsicJsx } = optionsFirst<RouteSurfaceOptions>(context)

        for (const binding of exportsCollect(program)) {
          if (binding.exportedName !== exportName) {
            context.report({
              node: binding.node,
              messageId: 'extraExport',
              data: { expected: exportName, actual: binding.exportedName },
            })
          }
        }

        const banned = new Set(bannedHooks)

        for (const item of declarationsTopLevelUnexportedFunctions(program)) {
          routesInspectFunction(context, item, banned, banIntrinsicJsx)
        }
      },
    }
  },
})
