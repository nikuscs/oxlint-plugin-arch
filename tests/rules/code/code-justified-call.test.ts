import { describe, it } from 'vitest'
import { codeJustifiedCall } from '../../../src/rules/code/code-justified-call.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-justified-call', () => {
  it.each([
    { name: 'other calls pass', code: 'Effect.tryPromise(run)', options: { calls: ['Effect.promise'] } },
    { name: 'a comment above passes', code: '// SAFETY: run never rejects\nEffect.promise(run)', options: { calls: ['Effect.promise'] } },
    { name: 'a multi-line comment above passes', code: '// SAFETY: run never rejects,\n// it catches every error\nEffect.promise(run)', options: { calls: ['Effect.promise'] } },
    { name: 'a custom comment passes', code: '// SAFE: run never rejects\nEffect.promise(run)', options: { calls: ['Effect.promise'], comment: 'SAFE:' } },
    { name: 'a bare call fails', code: 'Effect.promise(run)', options: { calls: ['Effect.promise'] }, errors: ['missing'] },
    { name: 'an empty reason fails', code: '// SAFETY:\nEffect.promise(run)', options: { calls: ['Effect.promise'] }, errors: ['missing'] },
    {
      name: 'a message is appended',
      code: 'Effect.promise(run)',
      options: { calls: ['Effect.promise'], message: 'Use Effect.tryPromise.' },
      errors: ['Effect.promise needs a `// SAFETY: <why>` comment on the line above. Use Effect.tryPromise.'],
    },
  ])('$name', (row) => testerRun(codeJustifiedCall, row))
})
