import { test } from 'vitest'
import { requireSafetyCommentForTypeAssertionRule } from '../rules/dillon-anti-slop/rules/require-safety-comment-for-type-assertion.ts'
import { createRuleTester } from './rule-tester.ts'

test('SAFETY comments attach to exported assertions without leaking into unrelated statements', () => {
  createRuleTester().run('dillon-anti-slop/require-safety-comment-for-type-assertion', requireSafetyCommentForTypeAssertionRule, {
    valid: [
      '// SAFETY: Validated by the input parser.\nexport const value = input as string;',
      '// SAFETY: Validated by the input parser.\nexport default input as string;',
      '// SAFETY: Validated by the input parser.\nconst value = input as string;',
      'const value = "one" as const;',
    ],
    invalid: [
      { code: 'export const value = input as string;', errors: [{ messageId: 'missingSafetyComment' }] },
      { code: '// SAFETY: Applies only to the first assertion.\nconst first = input as string;\nexport const second = input as string;', errors: [{ messageId: 'missingSafetyComment' }] },
      { code: '// SAFETY: Cannot justify an assertion inside a function.\nexport function value() { return input as string; }', errors: [{ messageId: 'missingSafetyComment' }] },
    ],
  })
})
