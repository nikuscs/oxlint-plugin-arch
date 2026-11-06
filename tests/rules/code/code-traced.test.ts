import { describe, it } from 'vitest'
import { codeTraced } from '../../../src/rules/code/code-traced.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-traced', () => {
  it.each([
    { name: 'a traced export passes', code: "export const send = Effect.fn('mail.send')(function* () {})" },
    { name: 'a private untraced function passes', code: 'const send = Effect.fnUntraced(function* () {})' },
    { name: 'an untraced export fails', code: 'export const send = Effect.fnUntraced(function* () {})', errors: ['surface'] },
    { name: 'an untraced service method fails', code: 'Mail.of({ send: Effect.fnUntraced(function* () {}) })', errors: ['surface'] },
    { name: 'a service method by name fails', code: 'const send = Effect.fnUntraced(function* () {})\nMail.of({ send })', errors: ['surface'] },
    { name: 'a skipped tag passes', code: 'MailDriver.of({ send: Effect.fnUntraced(function* () {}) })', options: { skip: 'Driver$' } },
    { name: 'exports outside the pattern pass', code: 'export const send = Effect.fnUntraced(function* () {})', filename: 'src/mail/mail.utils.ts', options: { exports: '/mail[.]ts$' } },
    {
      name: 'exports inside the pattern fail',
      code: 'export const send = Effect.fnUntraced(function* () {})',
      filename: 'src/mail/mail.ts',
      options: { exports: '/mail[.]ts$' },
      errors: ['surface'],
    },
    { name: 'custom untraced calls', code: 'export const send = trace.off(run)', options: { untraced: ['trace.off'] }, errors: ['surface'] },
  ])('$name', (row) => testerRun(codeTraced, row))
})
