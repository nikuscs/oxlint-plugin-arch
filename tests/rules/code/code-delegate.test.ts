import { describe, it } from 'vitest'
import { codeDelegate } from '../../../src/rules/code/code-delegate.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-delegate', () => {
  it.each([
    {
      name: 'reads then returns an object with a plain call',
      code: 'const session = rpc.authed.app.auth.session.effect(function* () { const { user, session } = yield* Actor.Actor; return { user, session: Option.getOrNull(session) } })',
    },
    {
      name: 'two reads, one delegated call and a return',
      code: 'rpc.app.orders.cancel.effect(function* ({ input }) { const actor = yield* Actor.Actor; const db = yield* Database.Database; yield* orderActionCancel({ actor, db, input }); return input })',
    },
    {
      name: 'one read and a returned delegated call',
      code: 'rpc.app.events.effect(function* () { const channel = yield* Channel.Channel; return yield* Orpc.eventIterator(Realtime.events({ channel, schema })) })',
    },
    { name: 'no read and a returned delegated call', code: 'rpc.app.orders.list.effect(function* ({ input }) { return yield* orderQueryList(input) })' },
    {
      name: 'a service option read and another read',
      code: 'rpc.app.auth.bootstrap.effect(function* () { const actor = yield* Effect.serviceOption(Actor.Actor); const auth = yield* Auth.Auth; return yield* auth.bootstrap({ actor }) })',
    },
    { name: 'an arrow with an expression body', code: 'os.handler(async ({ input }) => service.create(input))' },
    { name: 'an arrow that returns an awaited call', code: 'os.handler(async ({ input }) => { return await service.create(input) })' },
    { name: 'a function given to another method is not a handler', code: 'items.map(function* () { if (a) { yield 1 } })' },
    { name: 'max allows more calls', code: 'os.handler(async () => { await first(); return await second() })', options: { max: 2 } },
    { name: 'custom reads', code: 'rpc.effect(function* () { const tag = yield* Effect.service(Tag); return yield* run(tag) })', options: { reads: ['Effect.service'] } },
    { name: 'custom methods', code: 'os.resolve(async () => { return await run() })', options: { methods: ['resolve'] } },
    {
      name: 'logic in a handler',
      code: `rpc.authed.app.orders.logic.effect(function* ({ input }) {
  const actor = yield* Actor.Actor
  const db = yield* Database.Database
  const rows = yield* db.selectFrom('orders').selectAll().execute()
  if (rows.length > input.limit) { return yield* orderActionCreate({ actor, input }) }
  const total = rows.reduce((sum, row) => sum + row.price, 0)
  return { total }
})`,
      errors: ['statement', 'calls', 'statement', 'nested'],
    },
    { name: 'a ternary in the return', code: 'os.handler(async ({ input }) => { return input.all ? input.orders : [] })', errors: ['ternary'] },
    { name: 'a for of loop', code: 'os.handler(async ({ input }) => { for (const item of input) { await run(item) } })', errors: ['statement'] },
    { name: 'a while loop', code: 'os.handler(async () => { while (ready) { await run() } })', errors: ['statement'] },
    { name: 'a try block', code: 'os.handler(async () => { try { return await run() } catch { return null } })', errors: ['statement'] },
    { name: 'a switch', code: 'os.handler(async ({ input }) => { switch (input.kind) { default: return await run() } })', errors: ['statement'] },
    {
      name: 'a service option read counts as a call without reads',
      code: 'rpc.effect(function* () { const actor = yield* Effect.serviceOption(Actor.Actor); return yield* run(actor) })',
      options: { reads: [] },
      errors: ['calls'],
    },
    { name: 'max zero reports the only call', code: 'os.handler(async () => { return await run() })', options: { max: 0 }, errors: ['calls'] },
  ])('$name', (row) => testerRun(codeDelegate, row))
})
