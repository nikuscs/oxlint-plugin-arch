import { test } from 'vitest'
import { folderPrefix } from '../rules/folder-prefix.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'prefix' }
const afterComponents = [{ after: 'components', singularize: 'trailing-s', separators: ['-'] }]

test('folder-prefix', () => {
  createRuleTester('tsx').run(
    'arch/folder-prefix',
    folderPrefix,
    {
      valid: [
        { filename: '/repo/components/sidebar/sidebar-rail.tsx', code: 'export {}' },
        { filename: '/repo/components/users/user-card.tsx', code: 'export {}' },
        { filename: '/repo/components/dialogs/dialog.tsx', code: 'export {}' },
        {
          filename: '/repo/src/components/admin/insights/admin-insights-foo.tsx',
          code: 'export {}',
          options: afterComponents,
        },
        {
          filename: '/repo/src/components/admin/insights/admin-insights-foo-chart.tsx',
          code: 'export {}',
          options: afterComponents,
        },
        {
          filename: '/repo/src/components/users/user-card.tsx',
          code: 'export {}',
          options: afterComponents,
        },
      ],
      invalid: [
        { filename: '/repo/components/sidebar/rail.tsx', code: 'export {}', errors: [error] },
        { filename: '/repo/components/users/profile.tsx', code: 'export {}', errors: [error] },
        {
          filename: '/repo/src/components/admin/insights/foo.tsx',
          code: 'export {}',
          options: afterComponents,
          errors: [error],
        },
        {
          filename: '/repo/src/components/admin/insights/insights-foo.tsx',
          code: 'export {}',
          options: afterComponents,
          errors: [error],
        },
      ],
    },
  )
})
