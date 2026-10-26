import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { testsConcurrentDb } from './tests-concurrent-db.ts'

describe('arch/tests-concurrent-db', () => {
  it.each([
    { name: 'an isolated fixture passes', code: "test.concurrent('saves', async ({ isolatedDb }) => { await isolatedDb.insert(1) })" },
    { name: 'a serial test may use db', code: "test('saves', async ({ db }) => { await db.insert(1) })" },
    { name: 'db in a concurrent test', code: "test.concurrent('saves', async ({ db }) => { await db.insert(1) })", errors: ['forbidden'] },
    { name: 'a renamed db binding', code: "test.concurrent('saves', async ({ db: database }) => { await database.insert(1) })", errors: ['forbidden'] },
    { name: 'db destructured in the body', code: "test.concurrent('saves', async (context) => { const { db } = context })", errors: ['forbidden'] },
    {
      name: 'custom message',
      code: "test.concurrent('saves', async ({ db }) => { await db.insert(1) })",
      options: { message: 'Use isolatedDb.' },
      errors: ['forbidden'],
    },
  ])('$name', (row) => testerRun(testsConcurrentDb, row))
})
