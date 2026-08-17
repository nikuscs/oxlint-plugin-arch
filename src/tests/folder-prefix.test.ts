import { test } from 'vitest'
import { folderPrefix } from '../rules/folder-prefix.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'prefix' }

test('folder-prefix', () => {
  createRuleTester('tsx').run(
    'arch/folder-prefix',
    folderPrefix,
    {
      valid: [
        { filename: '/repo/components/sidebar/sidebar-rail.tsx', code: 'export {}' },
        { filename: '/repo/components/users/user-card.tsx', code: 'export {}' },
        { filename: '/repo/components/dialogs/dialog.tsx', code: 'export {}' },
      ],
      invalid: [
        { filename: '/repo/components/sidebar/rail.tsx', code: 'export {}', errors: [error] },
        { filename: '/repo/components/users/profile.tsx', code: 'export {}', errors: [error] },
      ],
    },
  )
})
