import { describe, it } from 'vitest'
import { noUnknownParametersRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-unknown-parameters.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-unknown-parameters', () => {
  it.each([
    { name: 'an owner contract passes', code: 'export function handle(payload: Order) {}' },
    { name: 'an error boundary passes', code: 'export function report(error: unknown) {}' },
    { name: 'a cause boundary passes', code: 'export function report(cause: unknown) {}' },
    { name: 'an unparsed input fails', code: 'export function handle(payload: unknown) {}', errors: ['unknownParameter'] },
    { name: 'an arrow parameter is checked', code: 'const handle = (payload: unknown) => payload', errors: ['unknownParameter'] },
    { name: 'a signature is checked', code: 'type Handler = (payload: unknown) => void', errors: ['unknownParameter'] },
    { name: 'a defaulted destructured parameter names only its binding', code: 'export function handle({ id }: unknown = {}) {}', errors: ['Parameter `{ id }` leaves input unparsed. Accept a named domain type; run the expected schema or parser at the I/O boundary before calling this function.'] },
  ])('$name', (row) => testerRun(noUnknownParametersRule, row))
})
