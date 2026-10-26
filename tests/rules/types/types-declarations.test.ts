import { describe, it } from 'vitest'
import { typesDeclarations } from '../../../src/rules/types/types-declarations.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/types-declarations', () => {
  it.each([
    { name: 'a file without types passes', code: 'export function listAccounts() { return [] }' },
    { name: 'an allowed name passes', code: "type AccessErrorKind = 'denied'", options: { allow: 'ErrorKind$' } },
    {
      name: 'an allowed value passes',
      code: 'const makeRetry = () => ({})\nexport type Retry = ReturnType<typeof makeRetry>',
      options: { allow: '^= ReturnType<typeof ' },
    },
    {
      name: 'name and value patterns together',
      code: 'export type Retry = ReturnType<typeof makeRetry>\nexport interface OrderService {}',
      options: { allow: ['Service$', '^= ReturnType<typeof '] },
    },
    { name: 'an interface', code: 'interface User { id: string }', errors: ['typeDeclaration'] },
    { name: 'a type alias', code: "type Status = 'draft' | 'done'", errors: ['typeDeclaration'] },
    { name: 'an empty allow pattern allows nothing', code: "type AccessErrorKind = 'denied'", options: { allow: '' }, errors: ['typeDeclaration'] },
    {
      name: 'an unmatched name beside an allowed one',
      code: "type Draft = {}\ntype AccessErrorKind = 'denied'",
      options: { allow: 'ErrorKind$' },
      errors: ['typeDeclaration'],
    },
    { name: 'name patterns ignore the value', code: 'type Draft = AccessErrorKind', options: { allow: 'ErrorKind$' }, errors: ['typeDeclaration'] },
    {
      name: 'value patterns match the whole value and skip interfaces',
      code: 'type Retry = { run: ReturnType<typeof makeRetry> }\ninterface RetryDeps {}',
      options: { allow: '^= ReturnType<typeof ' },
      errors: ['typeDeclaration', 'typeDeclaration'],
    },
  ])('$name', (row) => testerRun(typesDeclarations, row))
})
