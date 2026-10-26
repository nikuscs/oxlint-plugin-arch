import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noUnsafeDictionaryTypeRule } from './no-unsafe-dictionary-type.ts'

describe('dillon-anti-slop/no-unsafe-dictionary-type', () => {
  it.each([
    { name: 'concrete values pass', code: 'type Settings = Record<string, string | number>' },
    { name: 'a named value contract passes', code: 'type Settings = Record<string, User>' },
    { name: 'unknown values fail', code: 'type Settings = Record<string, unknown>', errors: ['unsafeDictionary'] },
    { name: 'any values fail', code: 'type Settings = Record<string, any>', errors: ['unsafeDictionary'] },
    { name: 'object values fail', code: 'type Settings = Record<string, object>', errors: ['unsafeDictionary'] },
    { name: 'empty object values fail', code: 'type Settings = Record<string, {}>', errors: ['unsafeDictionary'] },
    { name: 'an index signature is checked', code: 'interface Settings { [key: string]: unknown }', errors: ['unsafeDictionary'] },
  ])('$name', (row) => testerRun(noUnsafeDictionaryTypeRule, row))
})
