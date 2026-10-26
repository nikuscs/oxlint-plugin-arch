import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noUnknownParametersRule } from './no-unknown-parameters.ts'

describe('dillon-anti-slop/no-unknown-parameters', () => {
  it.each([
    { name: 'an owner contract passes', code: 'export function handle(payload: Order) {}' },
    { name: 'an error boundary passes', code: 'export function report(error: unknown) {}' },
    { name: 'a cause boundary passes', code: 'export function report(cause: unknown) {}' },
    { name: 'an unparsed input fails', code: 'export function handle(payload: unknown) {}', errors: ['unknownParameter'] },
    { name: 'an arrow parameter is checked', code: 'const handle = (payload: unknown) => payload', errors: ['unknownParameter'] },
    { name: 'a signature is checked', code: 'type Handler = (payload: unknown) => void', errors: ['unknownParameter'] },
  ])('$name', (row) => testerRun(noUnknownParametersRule, row))
})
