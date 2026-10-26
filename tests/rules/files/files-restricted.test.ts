import { describe, it } from 'vitest'
import { filesRestricted } from '../../../src/rules/files/files-restricted.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/files-restricted', () => {
  it.each([
    { name: 'reports a file with code', code: 'export const api = {}', options: { message: 'Legacy code is frozen.' }, errors: ['restricted'] },
    { name: 'reports an empty module', code: 'export {}', options: { message: 'Legacy code is frozen.' }, errors: ['restricted'] },
    {
      name: 'a hook in a restricted TSX file',
      filename: '/repo/hooks/use-thing.tsx',
      code: 'export function useThing() {}',
      options: { message: 'Hooks must use .ts files.' },
      errors: ['restricted'],
    },
  ])('$name', (row) => testerRun(filesRestricted, row))
})
