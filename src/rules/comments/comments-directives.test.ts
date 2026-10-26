import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { commentsDirectives } from './comments-directives.ts'

describe('arch/comments-directives', () => {
  it.each([
    { name: 'plain comments pass', code: '// load the user\nconst user = load()' },
    { name: 'a named rule with a reason passes', code: '// oxlint-disable-next-line no-explicit-any -- third-party callback type\nrun(input as never)' },
    { name: 'an eslint block directive with a reason passes', code: '/* eslint-disable no-console -- CLI output */\nconsole.log(1)' },
    { name: 'a reason may contain dashes', code: 'console.log(1) // oxlint-disable-line no-console -- output -- on purpose' },
    { name: 'no rule name', code: '// oxlint-disable-next-line -- no named rule\nconsole.log(1)', errors: ['directive'] },
    { name: 'no reason', code: '// oxlint-disable-next-line no-console\nconsole.log(1)', errors: ['directive'] },
    { name: 'an empty reason', code: '// oxlint-disable-next-line no-console --\nconsole.log(1)', errors: ['directive'] },
    { name: 'a bare file disable', code: '/* eslint-disable */\nconsole.log(1)', errors: ['directive'] },
    { name: 'one report per directive', code: 'a() // eslint-disable-line\nb() // oxlint-disable-line no-console', errors: ['directive', 'directive'] },
  ])('$name', (row) => testerRun(commentsDirectives, row))
})
