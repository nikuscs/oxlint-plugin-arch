import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { namingTypes } from './naming-types.ts'

describe('arch/naming-types', () => {
  it.each([
    { name: 'a PascalCase interface passes', code: 'interface UserProps { id: string }' },
    { name: 'digits pass', code: 'interface User2Props { id: string }' },
    { name: 'type aliases are skipped', code: 'type user_props = { id: string }' },
    { name: 'a snake_case interface', code: 'interface user_props { id: string }', errors: ['forbidden'] },
    { name: 'a camelCase interface', code: 'interface userProps { id: string }', errors: ['forbidden'] },
    { name: 'an underscore inside the name', code: 'interface User_Props { id: string }', errors: ['forbidden'] },
    { name: 'a custom message', code: 'interface userProps { id: string }', options: { message: 'Use PascalCase.' }, errors: ['Use PascalCase.'] },
  ])('$name', (row) => testerRun(namingTypes, row))
})
