import { test } from 'vitest'
import { noFileLevelHelpers } from '../rules/no-file-level-helpers.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'helper' }

test('no-file-level-helpers', () => {
  createRuleTester('tsx').run(
    'arch/no-file-level-helpers',
    noFileLevelHelpers,
    {
      valid: [
        'export function ContentForm() { return <form /> }',
        'export function useContentForm() { return null }',
        { code: 'export function makeContentForm() { return null }', options: [{ allowPattern: '^make[A-Z]' }] },
        'export function ContentForm() { function handleSubmit() {} return <form /> }',
      ],
      invalid: [
        { code: 'function handlePersonaSearch() {}\nexport function ContentForm() { return <form /> }', errors: [error] },
        { code: 'const buildPayload = () => ({})\nexport function ContentForm() { return <form /> }', errors: [error] },
      ],
    },
  )
})
