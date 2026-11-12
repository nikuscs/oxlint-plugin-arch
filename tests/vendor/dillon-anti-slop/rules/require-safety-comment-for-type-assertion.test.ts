import { describe, it } from 'vitest'
import { requireSafetyCommentForTypeAssertionRule } from '../../../../src/vendor/dillon-anti-slop/rules/require-safety-comment-for-type-assertion.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/require-safety-comment-for-type-assertion', () => {
  it.each([
    { name: 'a const assertion passes', code: 'const status = "ready" as const' },
    {
      name: 'a statement justification passes',
      code: '// SAFETY: the handler is only attached to input elements\nconst input = event.target as HTMLInputElement',
    },
    { name: 'an inline justification passes', code: 'const input = /* SAFETY: the target was checked */ event.target as HTMLInputElement' },
    { name: 'a justified exported const passes', code: '// SAFETY: Validated by the input parser.\nexport const value = input as string;' },
    { name: 'a justified default export passes', code: '// SAFETY: Validated by the input parser.\nexport default input as string;' },
    { name: 'an unjustified assertion fails', code: 'const input = event.target as HTMLInputElement', errors: ['missingSafetyComment'] },
    {
      name: 'an ordinary comment is not a justification',
      code: '// Read the input\nconst input = event.target as HTMLInputElement',
      errors: ['missingSafetyComment'],
    },
    { name: 'an unjustified exported assertion', code: 'export const value = input as string;', errors: ['missingSafetyComment'] },
    {
      name: 'a second assertion under one justification',
      code: '// SAFETY: Applies only to the first assertion.\nconst first = input as string;\nexport const second = input as string;',
      errors: ['missingSafetyComment'],
    },
    {
      name: 'a justification above a function body',
      code: '// SAFETY: Cannot justify an assertion inside a function.\nexport function value() { return input as string; }',
      errors: ['missingSafetyComment'],
    },
    { name: 'a custom comment passes', code: '// INVARIANT: only inputs\nconst input = target as HTMLInputElement', options: { comment: 'INVARIANT:' } },
    {
      name: 'a custom comment replaces SAFETY',
      code: '// SAFETY: only inputs\nconst input = target as HTMLInputElement',
      options: { comment: 'INVARIANT:' },
      errors: ['This type assertion has no `INVARIANT:` justification. State the checked invariant immediately before the assertion or its containing statement.'],
    },
    { name: 'a non-ASCII comment prefix passes', code: '// ÉTAT: only inputs\nconst input = target as HTMLInputElement', options: { comment: 'ÉTAT:' } },
    { name: 'a prefix inside a word does not count', code: '// UNSAFETY: no\nconst input = target as HTMLInputElement', errors: ['missingSafetyComment'] },
  ])('$name', (row) => testerRun(requireSafetyCommentForTypeAssertionRule, row))
})
