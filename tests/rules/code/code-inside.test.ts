import { describe, it } from 'vitest'
import { codeInside } from '../../../src/rules/code/code-inside.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-inside', () => {
  it.each([
    { name: 'no options checks nothing', code: 'db.transaction(() => send())' },
    { name: 'the call outside passes', code: 'send(); db.transaction(() => save())', options: { inside: [{ callee: '*.transaction', calls: { send: 'Send after the commit.' } }] } },
    { name: 'another callback passes', code: 'items.map(() => send())', options: { inside: [{ callee: '*.transaction', calls: { send: '' } }] } },
    { name: 'a call in the arguments is not inside the callback', code: 'db.transaction(send(), () => save())', options: { inside: [{ callee: '*.transaction', calls: { send: '' } }] } },
    { name: 'a banned call in the callback', code: 'db.transaction(() => send())', options: { inside: [{ callee: '*.transaction', calls: { send: '' } }] }, errors: ['inside'] },
    { name: 'a banned call in a generator callback', code: 'db.transaction(function* () { yield* Flows.OrderWorkflow.execute(payload) })', options: { inside: [{ callee: '*.transaction', calls: { '*Workflow.execute': '' } }] }, errors: ['inside'] },
    { name: 'a call in a wrapper call in the arguments is not inside', code: 'db.transaction(wrap(send()))', options: { inside: [{ callee: '*.transaction', calls: { send: '' } }] } },
    {
      name: 'a banned call in an Effect.gen callback',
      code: 'db.transaction(Effect.gen(function* () { yield* OrderWorkflow.execute(payload) }))',
      options: { inside: [{ callee: '*.transaction', calls: { '*Workflow.execute': '' } }] },
      errors: ['inside'],
    },
    {
      name: 'a banned call in an Effect.fn callback',
      code: "db.transaction(Effect.fn('order.save')(function* () { yield* OrderWorkflow.execute(payload) }))",
      options: { inside: [{ callee: '*.transaction', calls: { '*Workflow.execute': '' } }] },
      errors: ['inside'],
    },
    { name: 'a banned call nested deeper', code: 'db.transaction(() => rows.map((row) => mail.send(row)))', options: { inside: [{ callee: ['*.transaction'], calls: { '*.send': '' } }] }, errors: ['inside'] },
    {
      name: 'the report names both calls',
      code: 'db.transaction(() => mail.send())',
      options: { inside: [{ callee: 'db.transaction', calls: { 'mail.send': 'Send after the commit.' } }] },
      errors: ["Do not call 'mail.send' inside db.transaction. Send after the commit."],
    },
  ])('$name', (row) => testerRun(codeInside, row))
})
