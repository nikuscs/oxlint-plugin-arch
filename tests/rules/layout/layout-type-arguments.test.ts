import { describe, it } from 'vitest'
import { layoutTypeArguments } from '../../../src/rules/layout/layout-type-arguments.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-type-arguments', () => {
  it.each([
    { name: 'a short union passes', code: 'const value = load<A | B>()' },
    { name: 'several plain arguments pass', code: 'type Run = Effect<A, E, R>' },
    { name: 'a split union passes', code: 'const value = load<\n  | A\n  | B\n  | C\n>()' },
    { name: 'min raises the threshold', code: 'const value = load<A | B | C>()', options: { min: 4 } },
    {
      name: 'a union in a call splits',
      code: 'const live = Auth.layer<Blacklist.Blacklist | Database.Database | Mail.Mail>({})',
      output: 'const live = Auth.layer<\n  | Blacklist.Blacklist\n  | Database.Database\n  | Mail.Mail\n>({})',
      errors: ['union'],
    },
    {
      name: 'a union beside other arguments splits every argument',
      code: "type Props = Omit<Base, 'a' | 'b' | 'c'>",
      output: "type Props = Omit<\n  Base,\n  | 'a'\n  | 'b'\n  | 'c'\n>",
      errors: ['A union of 3+ types in type arguments puts each type on its own line.'],
    },
    { name: 'a leading bar stays first', code: 'type Run = Box<| A | B | C>', output: 'type Run = Box<\n  | A\n  | B\n  | C\n>', errors: ['union'] },
    { name: 'the fix keeps the indent', code: 'function run() {\n  load<A | B | C>()\n}', output: 'function run() {\n  load<\n    | A\n    | B\n    | C\n  >()\n}', errors: ['union'] },
    { name: 'a parenthesized member reports without a fix', code: 'type Run = Box<(A) | B | C>', output: null, errors: ['union'] },
    { name: 'a comment reports without a fix', code: 'type Run = Box<A | /* x */ B | C>', output: null, errors: ['union'] },
    { name: 'the fix is stable once applied', code: 'const value = load<\n  | A\n  | B\n  | C\n>()' },
    { name: 'a union after other arguments keeps a leading bar', code: 'type Run = Box<A, | B | C | D>', output: 'type Run = Box<\n  A,\n  | B\n  | C\n  | D\n>', errors: ['union'] },
  ])('$name', (row) => testerRun(layoutTypeArguments, row))
})
