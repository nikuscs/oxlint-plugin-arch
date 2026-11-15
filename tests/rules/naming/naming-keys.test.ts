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
    { name: 'an exported object is read by name', code: 'export const rpcAppOrders = { create: a }', options: { exports: '^rpc[A-Z]', name: '^a$' } },
    { name: 'key names follow a pattern', code: 'export const Contract = { schedule: { cancel: a }, list: b }', options: { exports: 'Contract$', keys: '^[a-z]+(?<!s)$' } },
    { name: 'a key reads its singular', code: 'export const contract = { admin: { payments: AdminPaymentContract, news: AdminNewsContract } }', options: { exports: '^contract$', name: '^(?:Admin)?{Key}Contract$', singularize: 'trailing-s' } },
    { name: 'the root of a member counts as its name', code: 'export const contract = { tools: ToolContract.app }', options: { exports: '^contract$', name: '^{Key}Contract$', singularize: 'trailing-s' } },
    { name: 'a handler returns the call its path names', code: 'export const rpcAppOrders = { schedule: { cancel: rpc.app.orders.schedule.cancel.effect(function* ({ input }) { const orders = yield* Orders.Orders; return yield* orders.schedule.cancel({ input }) }) } }', options: { exports: '^rpc', delegate: true } },
    { name: 'an allowed path is skipped', code: 'export const rpcAppUsers = { apiKeys: { list: rpc.x.effect(function* () { return yield* kit.listKeys() }) } }', options: { exports: '^rpc', delegate: true, allow: '^apiKeys\\.' } },
    { name: 'a handler with no returned call is skipped', code: 'export const rpcAppAuth = { session: rpc.x.effect(function* () { return yield* ActorKit.Actor }) }', options: { exports: '^rpc', delegate: true } },
    { name: 'a wrapped result still reads the yielded call', code: 'export const rpcPublicFingerprint = { resolve: rpc.x.effect(function* ({ input }) { return Option.getOrNull(yield* fingerprint.resolve(input)) }) }', options: { exports: '^rpc', delegate: true } },
    { name: 'a result held in a local reads its yielded call', code: 'export const rpcPublicFingerprint = { resolve: rpc.x.effect(function* () { const entry = yield* fingerprint.resolve(); return Option.getOrNull(entry) }) }', options: { exports: '^rpc', delegate: true } },
    { name: 'a generator that returns a plain call is skipped', code: 'export const rpcAppAuth = { session: rpc.x.effect(function* () { return Option.none() }) }', options: { exports: '^rpc', delegate: true } },
    { name: 'a plural key', code: 'export const Contract = { refills: { list: a } }', options: { exports: 'Contract$', keys: '^[a-z]+(?<!s)$' }, errors: ["Key 'refills' in 'refills' must match ^[a-z]+(?<!s)$."] },
    { name: 'a compound key', code: 'export const Contract = { setStatus: a }', options: { exports: 'Contract$', keys: '^[a-z]+$' }, errors: ['key'] },
    { name: 'a mount under another word', code: 'export const contract = { admin: { transactions: AdminWalletContract } }', options: { exports: '^contract$', name: '^(?:Admin)?{Key}Contract$', singularize: 'trailing-s' }, errors: ['name'] },
    { name: 'an inline function where names are required', code: 'Realtime.of({ authorize: ({ user }) => check(user), events: query })', options: { callees: ['*.of'], inline: false }, errors: ["Bind a named function under 'authorize', not an inline one."] },
    {
      name: 'a handler that calls another method',
      code: 'export const rpcPublicFingerprint = { store: rpc.public.fingerprint.store.effect(function* ({ input }) { const fingerprint = yield* Kit.Fingerprint; return yield* fingerprint.collect(input) }) }',
      options: { exports: '^rpc', delegate: true },
      errors: ["'store' must return a call to 'store' on its service, not 'fingerprint.collect'."],
    },
    { name: 'a nested handler off its path', code: 'export const rpcAppNotifications = { preference: { get: rpc.x.effect(function* () { return yield* notifications.preference.list() }) } }', options: { exports: '^rpc', delegate: true }, errors: ['delegate'] },
    { name: 'a local filled by another method', code: 'export const rpcPublicFingerprint = { get: rpc.x.effect(function* () { const entry = yield* fingerprint.resolve(); return Option.getOrNull(entry) }) }', options: { exports: '^rpc', delegate: true }, errors: ["'get' must return a call to 'get' on its service, not 'fingerprint.resolve'."] },
  ])('$name', (row) => testerRun(namingKeys, row))
})
