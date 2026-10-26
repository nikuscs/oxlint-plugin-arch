import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noForbiddenTermInSymbolNamesRule } from './no-shape-in-symbol-names.ts'

describe('dillon-anti-slop/no-shape-in-symbol-names', () => {
  it.each([
    { name: 'a domain name passes', code: 'interface User { id: string }' },
    { name: 'string contents are ignored', code: "const label = 'shape'" },
    { name: 'a structural name fails', code: 'interface UserShape { id: string }', errors: ['forbiddenSymbolName'] },
    { name: 'matching is case insensitive', code: 'const SHAPE = 1', errors: ['forbiddenSymbolName'] },
    { name: 'private names are checked', code: 'class User { #shape = 1 }', errors: ['forbiddenSymbolName'] },
    { name: 'JSX names are checked', code: 'const icon = <Shape />', errors: ['forbiddenSymbolName'] },
  ])('$name', (row) => testerRun(noForbiddenTermInSymbolNamesRule, row))
})
