import { describe, it } from 'vitest'
import { backendTableOwner } from '../../../src/rules/backend/backend-table-owner.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/backend-table-owner', () => {
  it.each([
    { name: 'its own table', code: "db.selectFrom('orders').selectAll()", filename: 'domains/order/order.queries.ts' },
    { name: 'its own prefixed table', code: "db.insertInto('orderSchedules').values(row)", filename: 'domains/order/order.actions.ts' },
    { name: 'an alias is stripped', code: "db.selectFrom('orders as o').selectAll()", filename: 'domains/order/order.queries.ts' },
    { name: 'a table with no known owner', code: "db.selectFrom('users').selectAll()", filename: 'domains/order/order.queries.ts' },
    { name: 'a join on another table', code: "db.selectFrom('orders').innerJoin('users', 'users.id', 'orders.userId')", filename: 'domains/order/order.queries.ts', options: { domains: ['user'] } },
    { name: 'a subquery in select', code: "db.selectFrom('orders').select((eb) => [eb.selectFrom('users').select('name').as('name')])", filename: 'domains/order/order.queries.ts', options: { domains: ['user'] } },
    { name: 'a subquery in where', code: "db.selectFrom('orders').where((eb) => eb.exists(eb.selectFrom('users')))", filename: 'domains/order/order.queries.ts', options: { domains: ['user'] } },
    { name: 'a dynamic table is skipped', code: 'db.selectFrom(table).selectAll()', filename: 'domains/order/order.queries.ts', options: { domains: ['user'] } },
    { name: 'a longer domain owns its tables', code: "db.selectFrom('supplierOrders').selectAll()", filename: 'domains/supplier-order/supplier-order.queries.ts', options: { domains: ['supplier'] } },
    { name: 'a shorter domain does not own a longer one', code: "db.selectFrom('suppliers').selectAll()", filename: 'domains/supplier/supplier.queries.ts', options: { domains: ['supplier-order'] } },
    { name: 'a word boundary is required', code: "db.selectFrom('orderly').selectAll()", filename: 'domains/user/user.queries.ts', options: { domains: ['order'] } },
    { name: 'the owner map wins', code: "db.selectFrom('sessions').selectAll()", filename: 'domains/auth/auth.queries.ts', options: { owners: { sessions: 'auth' }, domains: ['session'] } },
    { name: 'prefix off reads only the map', code: "db.selectFrom('users').selectAll()", filename: 'domains/order/order.queries.ts', options: { prefix: false, domains: ['user'] } },
    { name: 'a domain from the file template', code: "db.selectFrom('orders').selectAll()", filename: 'domains/order/queries/list.ts', options: { file: 'domains/{domain}/**', domains: ['user'] } },
    { name: 'a file the template misses is skipped', code: "db.selectFrom('users').selectAll()", filename: 'lib/db.ts', options: { file: 'domains/{domain}/**', domains: ['user'] } },
    {
      name: 'sibling folders are known domains',
      code: "db.selectFrom('orders').selectAll()",
      filename: 'domains/order/order.queries.ts',
      files: { 'domains/user/user.queries.ts': '' },
    },
    { name: 'another domain table', code: "db.selectFrom('users').selectAll()", filename: 'domains/order/order.queries.ts', options: { domains: ['user'] }, errors: ['owner'] },
    { name: 'a write to another domain', code: "db.updateTable('userProfiles').set(row)", filename: 'domains/order/order.actions.ts', options: { domains: ['user'] }, errors: ['owner'] },
    { name: 'a delete inside a callback', code: "run(() => trx.deleteFrom('users').execute())", filename: 'domains/order/order.actions.ts', options: { domains: ['user'] }, errors: ['owner'] },
    { name: 'a longer domain table from the shorter domain', code: "db.selectFrom('supplierOrders').selectAll()", filename: 'domains/supplier/supplier.queries.ts', options: { domains: ['supplier-order'] }, errors: ['owner'] },
    { name: 'the owner map', code: "db.selectFrom('sessions').selectAll()", filename: 'domains/order/order.queries.ts', options: { owners: { sessions: 'auth' } }, errors: ['owner'] },
    { name: 'custom methods', code: "db.from('users')", filename: 'domains/order/order.queries.ts', options: { methods: ['from'], domains: ['user'] }, errors: ['owner'] },
    {
      name: 'a sibling folder owns its table',
      code: "db.selectFrom('users').selectAll()",
      filename: 'domains/order/order.queries.ts',
      files: { 'domains/user/user.queries.ts': '' },
      errors: ['owner'],
    },
    {
      name: 'the message names table, owner and domain',
      code: "db.insertInto('users').values(row)",
      filename: 'domains/order/order.actions.ts',
      options: { domains: ['user'], message: 'Call the user service.' },
      errors: ["'users' belongs to the 'user' domain; 'order' reaches it through that domain, not with insertInto(). Call the user service."],
    },
  ])('$name', (row) => testerRun(backendTableOwner, row))
})
