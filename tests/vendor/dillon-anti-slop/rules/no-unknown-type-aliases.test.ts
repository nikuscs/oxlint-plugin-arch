import { describe, it } from 'vitest'
import { noUnknownTypeAliasesRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-unknown-type-aliases.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-unknown-type-aliases', () => {
  it.each([
    { name: 'an owner contract passes', code: 'type Payload = { id: string }' },
    { name: 'a cause field stays explicit', code: 'type Failure = { cause: unknown }' },
    { name: 'an unknown alias fails', code: 'type Payload = unknown', errors: ['unknownAlias'] },
    { name: 'an alias chain reports each alias', code: 'type Raw = unknown; type Payload = Raw', errors: ['unknownAlias', 'unknownAlias'] },
  ])('$name', (row) => testerRun(noUnknownTypeAliasesRule, row))
})
