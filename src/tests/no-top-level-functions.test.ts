import { test } from 'vitest'
import { noTopLevelFunctions } from '../rules/no-top-level-functions.ts'
import { createRuleTester } from './rule-tester.ts'

const functionError = { messageId: 'noFunction' }
const reExportError = { messageId: 'noReExport' }

test('no-top-level-functions', () => {
  createRuleTester().run(
    'arch/no-top-level-functions',
    noTopLevelFunctions,
    {
      valid: [
        {
          filename: '/repo/apps/server/src/types/layout.constants.ts',
          code: "export const layout = 'wide'",
        },
        {
          filename: '/repo/apps/web/tests/e2e/example.auth.spec.ts',
          code: "export * from './fixture.ts'",
          options: [{ banReExports: false }],
        },
      ],
      invalid: [
        {
          filename: '/repo/apps/server/src/types/layout.constants.ts',
          code: 'export function getLayout() { return 1 }',
          errors: [functionError],
        },
        {
          filename: '/repo/apps/server/src/types/layout.constants.ts',
          code: 'const getLayout = () => 1',
          errors: [functionError],
        },
        {
          filename: '/repo/apps/server/src/types/layout.constants.ts',
          code: "export * from './layout-base.ts'",
          errors: [reExportError],
        },
      ],
    },
  )
})
