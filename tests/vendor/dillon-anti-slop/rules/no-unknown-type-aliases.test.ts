import { describe, it } from 'vitest'
import { noUnknownTypeAliasesRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-unknown-type-aliases.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-unknown-type-aliases', () => {
  it.each([
    { name: 'an owner contract passes', code: 'type Payload = { id: string }' },
    { name: 'a cause field stays explicit', code: 'type Failure = { cause: unknown }' },
    { name: 'an unknown alias fails', code: 'type Payload = unknown', errors: ['unknownAlias'] },
    { name: 'an alias chain reports each alias', code: 'type Raw = unknown; type Payload = Raw', errors: ['unknownAlias', 'unknownAlias'] },
    { name: 'a union with unknown fails', code: 'type Payload = string | unknown', errors: ['unknownAlias'] },
    { name: 'a nested union with unknown fails twice', code: 'type Payload = string | unknown; type NestedPayload = number | Payload', errors: ['unknownAlias', 'unknownAlias'] },
    { name: 'a generic identity of unknown fails', code: 'type Identity<T> = T; type Payload = Identity<unknown>', errors: ['unknownAlias'] },
    { name: 'a nested generic identity of unknown fails', code: 'type Identity<T> = T; type Wrapped<T> = Identity<T>; type Payload = Wrapped<unknown>', errors: ['unknownAlias'] },
    { name: 'a function-local unknown alias fails', code: 'function outer() { type Payload = unknown }', errors: ['unknownAlias'] },
    { name: 'an identity of an identity of unknown fails', code: 'type Identity<T> = T; type Payload = Identity<Identity<unknown>>', errors: ['unknownAlias'] },
  ])('$name', (row) => testerRun(noUnknownTypeAliasesRule, row))
})
