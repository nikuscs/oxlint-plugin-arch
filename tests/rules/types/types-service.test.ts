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
    { name: 'a configured factory prefix passes', code: 'export type UserService = ReturnType<typeof createUserService>', options: { factory: 'create' } },
    { name: 'the default prefix fails with another factory', code: 'type UserService = ReturnType<typeof makeUserService>', options: { factory: 'create' }, errors: ['domain'] },
    { name: 'a configured suffix passes', code: 'export type UserRepository = ReturnType<typeof makeUserRepository>', options: { suffix: 'Repository' } },
    { name: 'the default suffix fails with another suffix', code: 'type UserService = ReturnType<typeof makeUserService>', options: { suffix: 'Repository' }, errors: ['domain'] },
    {
      name: 'a configured suffix names itself in the message',
      code: 'interface UserRepository { find(id: string): User }',
      options: { suffix: 'Repository' },
      errors: ['Move this type to its domain types file; only the matching factory-derived Repository alias belongs here.'],
    },
    { name: 'another wrapper', code: 'type UserService = Awaited<typeof makeUserService>', errors: ['domain'] },
  ])('$name', (row) => testerRun(typesService, row))
})
