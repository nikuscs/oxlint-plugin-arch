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
    { name: 'contract chains are skipped without roots', code: 'export const get = oc.input(Input)' },
    { name: 'a message extends the handler report', code: 'os.input(Input).handler(run)', options: { message: 'Declare the response schema.' }, errors: ['oRPC procedures must declare .output() before .handler(). Declare the response schema.'] },
    { name: 'a contract procedure with output passes', code: 'export const get = oc.input(Input).output(Output)', options: { roots: ['oc'] } },
    { name: 'a route before output passes', code: "export const get = oc.route({ method: 'GET' }).output(Output)", options: { roots: ['oc'] } },
    { name: 'a custom output method is the default requirement', code: 'export const get = oc.input(Input).returns(Output)', options: { roots: ['oc'], output: 'returns' } },
    { name: 'chains from other roots are skipped', code: 'export const get = os.input(Input)', options: { roots: ['oc'] } },
    { name: 'a router is skipped', code: 'export const router = oc.router({ get })', options: { roots: ['oc'] } },
    { name: 'a call inside an argument is not a chain end', code: 'export const get = oc.meta(openapi({})).output(Output)', options: { roots: ['oc'] } },
    { name: 'every required method', code: 'export const list = read.meta(openapi({})).input(Input).output(Output)', options: { roots: ['read', 'write'], require: ['output', 'meta'] } },
    { name: 'procedures inside an object', code: 'export const Contract = { list: read.meta(a).output(b), save: write.meta(c).output(d) }', options: { roots: ['read', 'write'], require: ['output', 'meta'] } },
    { name: 'a dotted root', code: 'export const base = Kit.contract({}).meta(a).output(b)', options: { roots: ['Kit.contract'], require: ['output', 'meta'] } },
    { name: 'a call to the root alone is skipped by a longer root', code: 'export const base = Kit.contract({})', options: { roots: ['Kit.contract.meta'] } },
    { name: 'custom ignore list', code: 'export const base = oc.errors({ Missing })', options: { roots: ['oc'], ignore: ['errors'] } },
    { name: 'a contract procedure missing output', code: 'export const get = oc.input(Input)', options: { roots: ['oc'] }, errors: ['required'] },
    { name: 'a bare root call', code: 'export const base = Kit.contract({})', options: { roots: ['Kit.contract'] }, errors: ['required'] },
    { name: 'output inside an argument does not count', code: 'export const get = oc.input(wrap.output(Output))', options: { roots: ['oc'] }, errors: ['required'] },
    { name: 'one report per missing method', code: 'export const list = read.input(Input)', options: { roots: ['read', 'write'], require: ['output', 'meta'] }, errors: ['required', 'required'] },
    { name: 'missing meta', code: 'export const Contract = { list: read.input(a).output(b) }', options: { roots: ['read', 'write'], require: ['output', 'meta'] }, errors: ['required'] },
    { name: 'a dotted root missing meta', code: 'export const base = Kit.contract({}).output(b)', options: { roots: ['Kit.contract'], require: ['meta'] }, errors: ['required'] },
    {
      name: 'a contract message',
      code: 'export const get = oc.input(Input)',
      options: { roots: ['oc'], message: 'Declare the response schema.' },
      errors: ['This procedure must call .output(). Declare the response schema.'],
    },
  ])('$name', (row) => testerRun(backendOrpcOutput, row))
})
