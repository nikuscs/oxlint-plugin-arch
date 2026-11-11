import { describe, it } from 'vitest'
import { backendOrpcOutput } from '../../../src/rules/backend/backend-orpc-output.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/backend-orpc-output', () => {
  it.each([
    { name: 'named output schema', code: 'os.output(Chat).handler(run)' },
    { name: 'a plain function around a named schema', code: 'os.output(paged(Chat)).handler(run)' },
    { name: 'another plain function around a named schema', code: 'os.output(eventIterator(Chat)).handler(run)' },
    { name: 'unrelated methods pass', code: 'os.input(Chat).build(run)' },
    { name: 'intermediate calls retain output', code: 'os.output(Chat).input(Input).handler(run)' },
    { name: 'custom handler and output methods', code: 'os.returns(Chat).resolve(run)', options: { handler: 'resolve', output: 'returns' } },
    { name: 'computed literal methods', code: "os['output'](Chat)['handler'](run)" },
    { name: 'missing output', code: 'os.input(Input).handler(run)', errors: ['missing'] },
    { name: 'output after handler does not count', code: 'os.handler(run).output(Chat)', errors: ['missing'] },
    { name: 'inline output schema', code: 'os.output(z.object({})).handler(run)', errors: ['invalid'] },
    { name: 'a member call around a named schema', code: 'os.output(z.array(Chat)).handler(run)', errors: ['invalid'] },
    { name: 'a plain function around an inline schema', code: 'os.output(paged(z.object({}))).handler(run)', errors: ['invalid'] },
    { name: 'a plain function around another call', code: 'os.output(paged(wrap(Chat))).handler(run)', errors: ['invalid'] },
    { name: 'an object output', code: 'os.output({}).handler(run)', errors: ['invalid'] },
    { name: 'empty output', code: 'os.output().handler(run)', errors: ['invalid'] },
    { name: 'custom handler still requires output', code: 'os.resolve(run)', options: { handler: 'resolve', output: 'returns' }, errors: ['missing'] },
  ])('$name', (row) => testerRun(backendOrpcOutput, row))
})
