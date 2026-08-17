import { test } from 'vitest'
import { requireOrpcOutput } from '../rules/require-orpc-output.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ composers: ['paginatedOutput'], handlerMethod: 'handler', outputMethod: 'output' }]
const missing = { messageId: 'missing' }
const invalid = { messageId: 'invalid' }

test('require-orpc-output', () => {
  createRuleTester().run(
    'arch/require-orpc-output',
    requireOrpcOutput,
    {
      valid: [
        { code: 'procedure.output(brandApiDetail).handler(() => ({}))', options },
        { code: 'procedure.output(paginatedOutput(brandApiSummary)).handler(() => ({}))', options },
      ],
      invalid: [
        { code: 'procedure.input(inputSchema).handler(() => ({}))', options, errors: [missing] },
        { code: 'procedure.output(z.object({})).handler(() => ({}))', options, errors: [invalid] },
        { code: 'procedure.output(paginatedOutput(z.object({}))).handler(() => ({}))', options, errors: [invalid] },
      ],
    },
  )
})
