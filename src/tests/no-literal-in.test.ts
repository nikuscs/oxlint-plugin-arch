import { test } from 'vitest'
import { noLiteralIn } from '../rules/no-literal-in.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'literalIn' }

test('no-literal-in', () => {
  createRuleTester().run(
    'arch/no-literal-in',
    noLiteralIn,
    {
      valid: [
        'key in value',
        '0 in value',
        '`${prefix}Key` in value',
        "Object.hasOwn(value, 'kind')",
        "value.kind === 'record'",
        {
          code: "'serviceWorker' in navigator",
          options: [{ allow: ['serviceWorker'] }],
        },
        {
          code: '`serviceWorker` in navigator',
          options: [{ allow: ['serviceWorker'] }],
        },
      ],
      invalid: [
        { code: "'kind' in value", errors: [error] },
        { code: '"status" in value', errors: [error] },
        { code: '`ready` in value', errors: [error] },
        {
          code: "'kind' in value && 'serviceWorker' in navigator",
          options: [{ allow: ['serviceWorker'] }],
          errors: [error],
        },
      ],
    },
  )
})
