import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { boundariesRpcDatabase } from './boundaries-rpc-database.ts'

describe('arch/boundaries-rpc-database', () => {
  it.each([
    { name: 'handlers delegate to services', code: 'os.handler(({ context }) => context.services.chats.list())' },
    { name: 'a method reference is not a query', code: 'const select = db.selectFrom' },
    { name: 'dynamic method names are ignored', code: 'db[method](table)' },
    { name: 'bare functions are not query builders', code: 'selectFrom(table)' },
    { name: 'select query', code: "db.selectFrom('chats')", errors: ['forbidden'] },
    { name: 'insert query', code: "db.insertInto('chats')", errors: ['forbidden'] },
    { name: 'update query', code: "db.updateTable('chats')", errors: ['forbidden'] },
    { name: 'delete query', code: "db.deleteFrom('chats')", errors: ['forbidden'] },
    { name: 'merge query', code: "db.mergeInto('chats')", errors: ['forbidden'] },
    { name: 'raw query', code: 'db.executeQuery(query)', errors: ['forbidden'] },
    { name: 'literal computed method', code: "db['selectFrom']('chats')", errors: ['forbidden'] },
    { name: 'custom message retains enforcement', code: 'db.executeQuery(query)', options: { message: 'Use a service.' }, errors: ['forbidden'] },
  ])('$name', (row) => testerRun(boundariesRpcDatabase, row))
})
