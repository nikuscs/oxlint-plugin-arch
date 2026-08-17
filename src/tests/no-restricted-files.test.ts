import { test } from 'vitest'
import { noRestrictedFiles } from '../rules/no-restricted-files.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ message: 'Hooks must use .ts files.' }]
const error = { messageId: 'restricted' }

test('no-restricted-files', () => {
  createRuleTester('tsx').run(
    'arch/no-restricted-files',
    noRestrictedFiles,
    {
      valid: [],
      invalid: [
        { filename: '/repo/hooks/use-thing.tsx', code: 'export function useThing() {}', options, errors: [error] },
        { filename: '/repo/hooks/use-other.tsx', code: 'export {}', options, errors: [error] },
      ],
    },
  )
})
