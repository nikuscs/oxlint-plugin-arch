import { describe, it } from 'vitest'
import { namingPairs } from '../../../src/rules/naming/naming-pairs.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/naming-pairs', () => {
  it.each([
    { name: 'no options checks nothing', code: 'read.input(A).output(B)' },
    { name: 'a pair that shares its name', code: 'read.input(S.OrderListInput).output(S.OrderListOutput)', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] } },
    { name: 'calls between the pair are skipped', code: 'read.meta(x).input(OrderListInput).errors(e).output(OrderListOutput)', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] } },
    { name: 'one side missing passes', code: 'read.output(OrderListOutput)', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] } },
    { name: 'an inline value passes', code: 'read.input(OrderListInput).output(Schema.Array(Order))', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] } },
    { name: 'an allowed name passes', code: 'write.input(AdminUserIdInput).output(Accepted)', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'], allow: ['^Accepted$', 'IdInput$'] }] } },
    {
      name: 'a pair with different names',
      code: 'read.input(S.ToolResultSessionInput).output(S.ToolSessionOutput)',
      options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] },
      errors: ["'ToolSessionOutput' in .output() must share its name with 'ToolResultSessionInput' in .input()."],
    },
    { name: 'a plural on one side', code: 'read.input(OrderRefillStatusInput).output(OrderRefillsStatusOutput)', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] }, errors: ['pair'] },
    { name: 'one report per chain', code: 'const c = { a: read.input(AInput).output(BOutput), b: read.input(CInput).output(COutput) }', options: { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] }, errors: ['pair'] },
  ])('$name', (row) => testerRun(namingPairs, row))
})
