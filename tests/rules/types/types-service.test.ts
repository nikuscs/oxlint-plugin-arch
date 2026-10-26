import { describe, it } from 'vitest'
import { typesService } from '../../../src/rules/types/types-service.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/types-service', () => {
  it.each([
    { name: 'the factory-derived alias passes', code: 'export type UserService = ReturnType<typeof makeUserService>' },
    { name: 'a file without types passes', code: 'export function makeUserService() { return {} }' },
    { name: 'an interface', code: 'interface UserService { find(id: string): User }', errors: ['domain'] },
    { name: 'another alias', code: "type UserRole = 'admin' | 'member'", errors: ['domain'] },
    { name: 'another factory', code: 'type UserService = ReturnType<typeof makeTeamService>', errors: ['domain'] },
    { name: 'a name without Service', code: 'type UserDeps = ReturnType<typeof makeUserDeps>', errors: ['domain'] },
    { name: 'another wrapper', code: 'type UserService = Awaited<typeof makeUserService>', errors: ['domain'] },
  ])('$name', (row) => testerRun(typesService, row))
})
