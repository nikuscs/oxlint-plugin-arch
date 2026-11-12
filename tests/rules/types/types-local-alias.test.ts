import { describe, it } from 'vitest'
import { typesLocalAlias } from '../../../src/rules/types/types-local-alias.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/types-local-alias', () => {
  it.each([
    { name: 'an interface passes', code: 'interface ButtonProps { label: string }' },
    { name: 'an object alias', code: 'type ButtonProps = { label: string }', errors: ['forbidden'] },
    { name: 'a scalar alias', code: 'type UserId = string', errors: ['forbidden'] },
    { name: 'custom message is reported', code: 'type UserId = string', options: { message: 'Use an interface.' }, errors: ['Use an interface.'] },
    { name: 'allow keeps a matching alias', code: 'type ButtonVariant = string', options: { allow: 'Variant$' } },
    { name: 'allow reports other aliases', code: 'type ButtonProps = { label: string }', options: { allow: ['Variant$'] }, errors: ['forbidden'] },
  ])('$name', (row) => testerRun(typesLocalAlias, row))
})
