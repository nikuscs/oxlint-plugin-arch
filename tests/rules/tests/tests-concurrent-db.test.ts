import { describe, it } from 'vitest'
import { testsConcurrentDb } from '../../../src/rules/tests/tests-concurrent-db.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/tests-concurrent-db', () => {
  it.each([
    { name: 'an isolated fixture passes', code: "test.concurrent('saves', async ({ isolatedDb }) => { await isolatedDb.insert(1) })" },
    { name: 'a serial test may use db', code: "test('saves', async ({ db }) => { await db.insert(1) })" },
    {
      name: 'a local db destructured from another object passes',
      code: "test.concurrent('saves', async ({ isolatedDb }) => { const { db } = config; await isolatedDb.insert(db) })",
    },
    {
      name: 'a db pattern in a nested callback passes',
      code: "test.concurrent('saves', async ({ isolatedDb }) => { rows.map(({ db }) => isolatedDb.insert(db)) })",
    },
    { name: 'db in a concurrent test', code: "test.concurrent('saves', async ({ db }) => { await db.insert(1) })", errors: ['forbidden'] },
    { name: 'a renamed db binding', code: "test.concurrent('saves', async ({ db: database }) => { await database.insert(1) })", errors: ['forbidden'] },
    { name: 'db destructured in the body', code: "test.concurrent('saves', async (context) => { const { db } = context })", errors: ['forbidden'] },
    { name: 'db before a timeout', code: "test.concurrent('saves', async ({ db }) => { await db.insert(1) }, 1000)", errors: ['forbidden'] },
    {
      name: 'a custom message replaces the text',
      code: "test.concurrent('saves', async ({ db }) => { await db.insert(1) })",
      options: { message: 'Use isolatedDb.' },
      errors: ['Use isolatedDb.'],
    },
  ])('$name', (row) => testerRun(testsConcurrentDb, row))
})
