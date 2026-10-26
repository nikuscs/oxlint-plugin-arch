import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { backendOrpcOutput } from './backend-orpc-output.ts'

describe('arch/backend-orpc-output', () => {
  it.each([
    { name: 'named output schema', code: 'os.output(Chat).handler(run)', options: { composers: [] } },
    { name: 'configured schema composer', code: 'os.output(paged(Chat)).handler(run)', options: { composers: ['paged'] } },
    { name: 'unrelated methods pass', code: 'os.input(Chat).build(run)', options: { composers: [] } },
    { name: 'intermediate calls retain output', code: 'os.output(Chat).input(Input).handler(run)', options: { composers: [] } },
    { name: 'custom handler and output methods', code: 'os.returns(Chat).resolve(run)', options: { composers: [], handler: 'resolve', output: 'returns' } },
    { name: 'computed literal methods', code: "os['output'](Chat)['handler'](run)", options: { composers: [] } },
    {
      name: 'a named output schema passes',
      code: 'procedure.output(brandApiDetail).handler(() => ({}))',
      options: { composers: ['paginatedOutput'], handler: 'handler', output: 'output' },
    },
    {
      name: 'a composed named schema passes',
      code: 'procedure.output(paginatedOutput(brandApiSummary)).handler(() => ({}))',
      options: { composers: ['paginatedOutput'], handler: 'handler', output: 'output' },
    },
    { name: 'missing output', code: 'os.input(Input).handler(run)', options: { composers: [] }, errors: ['missing'] },
    { name: 'output after handler does not count', code: 'os.handler(run).output(Chat)', options: { composers: [] }, errors: ['missing'] },
    { name: 'inline output schema', code: 'os.output(z.object({})).handler(run)', options: { composers: [] }, errors: ['invalid'] },
    { name: 'empty output', code: 'os.output().handler(run)', options: { composers: [] }, errors: ['invalid'] },
    { name: 'unlisted composer', code: 'os.output(paged(Chat)).handler(run)', options: { composers: [] }, errors: ['invalid'] },
    { name: 'composer needs a named schema', code: 'os.output(paged(z.object({}))).handler(run)', options: { composers: ['paged'] }, errors: ['invalid'] },
    {
      name: 'custom handler still requires output',
      code: 'os.resolve(run)',
      options: { composers: [], handler: 'resolve', output: 'returns' },
      errors: ['missing'],
    },
    {
      name: 'a procedure without output',
      code: 'procedure.input(inputSchema).handler(() => ({}))',
      options: { composers: ['paginatedOutput'], handler: 'handler', output: 'output' },
      errors: ['missing'],
    },
    {
      name: 'an inline schema with custom options',
      code: 'procedure.output(z.object({})).handler(() => ({}))',
      options: { composers: ['paginatedOutput'], handler: 'handler', output: 'output' },
      errors: ['invalid'],
    },
    {
      name: 'a composer wrapping an inline schema',
      code: 'procedure.output(paginatedOutput(z.object({}))).handler(() => ({}))',
      options: { composers: ['paginatedOutput'], handler: 'handler', output: 'output' },
      errors: ['invalid'],
    },
  ])('$name', (row) => testerRun(backendOrpcOutput, row))
})
