import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { typesLocalAlias } from './types-local-alias.ts'

describe('arch/types-local-alias', () => {
  it.each([
    { name: 'an interface passes', code: 'interface ButtonProps { label: string }' },
    { name: 'an object alias', code: 'type ButtonProps = { label: string }', errors: ['forbidden'] },
    { name: 'a scalar alias', code: 'type UserId = string', errors: ['forbidden'] },
    { name: 'custom message is reported', code: 'type UserId = string', options: { message: 'Use an interface.' }, errors: ['Use an interface.'] },
  ])('$name', (row) => testerRun(typesLocalAlias, row))
})
