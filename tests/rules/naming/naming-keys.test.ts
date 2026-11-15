import { describe, it } from 'vitest'
import { namingKeys } from '../../../src/rules/naming/naming-keys.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/naming-keys', () => {
  it.each([
    { name: 'no options checks nothing', code: 'bind({ create: other })' },
    { name: 'an unlisted callee passes', code: 'other({ create: wrong })', options: { callees: ['bind'], name: '^{path}$' } },
    { name: 'a value named after its key', code: 'bind({ create: Actions.orderActionCreate })', filename: 'order/order.layer.ts', options: { callees: ['bind'], name: '^{folder}(?:Action|Query){Path}$' } },
    {
      name: 'a nested key joins the path',
      filename: 'order/order.layer.ts',
      code: 'Kit.bind({ schedule: { cancel: Actions.orderActionScheduleCancel }, list: Queries.orderQueryList })',
      options: { callees: ['Kit.bind'], name: '^{folder}(?:Action|Query){Path}$' },
    },
    { name: 'a camelCase key keeps its words', filename: 'mailing/mailing.layer.ts', code: 'bind({ event: { trackRegistered: mailingActionEventTrackRegistered } })', options: { callees: ['bind'], name: '^{folder}Action{Path}$' } },
    { name: 'a dashed folder is camelCase', filename: 'supplier-order/supplier-order.layer.ts', code: 'bind({ list: supplierOrderQueryList })', options: { callees: ['bind'], name: '^{folder}Query{Path}$' } },
    { name: 'an inline value is skipped', code: 'bind({ create: () => 1, ...rest, [key]: wrong })', options: { callees: ['bind'], name: '^{path}$' } },
    { name: 'several patterns are allowed', code: 'bind({ create: makeCreate })', options: { callees: ['bind'], name: ['^{path}$', '^make{Path}$'] } },
    { name: 'a callee wildcard', code: 'Orders.of({ create: create })', options: { callees: ['*.of'], name: '^{path}$' } },
    { name: 'a value off its key', filename: 'order/order.layer.ts', code: 'bind({ create: Actions.orderActionInsert })', options: { callees: ['bind'], name: '^{folder}(?:Action|Query){Path}$' }, errors: ['name'] },
    {
      name: 'a value off its nested path',
      filename: 'order/order.layer.ts',
      code: 'Kit.bind({ schedule: { cancel: Actions.orderActionCancel } })',
      options: { callees: ['Kit.bind'], name: '^{folder}(?:Action|Query){Path}$' },
      errors: ["'orderActionCancel' under key 'schedule.cancel' must match ^order(?:Action|Query)ScheduleCancel$."],
    },
    { name: 'a value off its domain', filename: 'order/order.layer.ts', code: 'bind({ list: Queries.userQueryList })', options: { callees: ['bind'], name: '^{folder}Query{Path}$' }, errors: ['name'] },
    { name: 'one report per value', code: 'bind({ a: x, b: { c: y } })', options: { callees: ['bind'], name: '^{path}$' }, errors: ['name', 'name'] },
  ])('$name', (row) => testerRun(namingKeys, row))
})
