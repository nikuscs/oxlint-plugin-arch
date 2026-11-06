import { describe, it } from 'vitest'
import { codeBranchOnce } from '../../../src/rules/code/code-branch-once.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-branch-once', () => {
  it.each([
    { name: 'one ternary per subject passes', code: "const a = user.kind === 'admin' ? 1 : 2" },
    { name: 'different subjects pass', code: "const a = user.kind === 'admin' ? 1 : 2\nconst b = team.kind === 'admin' ? 3 : 4" },
    { name: 'a non-string comparison passes', code: 'const a = user.age === 1 ? 1 : 2\nconst b = user.age === 2 ? 3 : 4' },
    { name: 'two ternaries on one subject fail', code: "const a = user.kind === 'admin' ? 1 : 2\nconst b = user.kind !== 'guest' ? 3 : 4", errors: ['once', 'once'] },
    { name: 'logical and negated tests count', code: "const a = !(user.kind === 'admin') ? 1 : 2\nconst b = ok && user.kind === 'guest' ? 3 : 4", errors: ['once', 'once'] },
  ])('$name', (row) => testerRun(codeBranchOnce, row))
})
