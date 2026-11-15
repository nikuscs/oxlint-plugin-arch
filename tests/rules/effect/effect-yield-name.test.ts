import { describe, it } from 'vitest'
import { effectYieldName } from '../../../src/rules/effect/effect-yield-name.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-yield-name', () => {
  it.each([
    { name: 'a local named after the service', code: 'function* run() { const orders = yield* Orders.Orders }' },
    { name: 'a multi-word service', code: 'function* run() { const activityLog = yield* ActivityLogKit.ActivityLog }' },
    { name: 'a lowercase member is not a service', code: 'function* run() { const time = yield* DateTime.now }' },
    { name: 'a call is not a service', code: 'function* run() { const row = yield* Orders.Orders.get() }' },
    { name: 'a destructured yield is skipped', code: 'function* run() { const { id } = yield* Kit.Organization }' },
    { name: 'a plain yield is skipped', code: 'function* run() { const x = yield Orders.Orders }' },
    { name: 'a listed name', code: 'function* run() { const db = yield* DatabaseKit.Database }', options: { names: { 'DatabaseKit.Database': 'db' } } },
    { name: 'a name listed for any namespace', code: 'function* run() { const db = yield* Other.Database }', options: { names: { '*.Database': ['db', 'database'] } } },
    { name: 'an allowed name', code: 'function* run() { const kitUsers = yield* AuthKit.Users }', options: { allow: '^kit' } },
    { name: 'a short local', code: 'function* run() { const service = yield* Orders.Orders }', errors: ['name'] },
    { name: 'a singular local', code: 'function* run() { const order = yield* Orders.Orders }', errors: ["Name this 'orders', not 'order': it holds Orders.Orders."] },
    { name: 'a listed service under another name', code: 'function* run() { const database = yield* DatabaseKit.Database }', options: { names: { 'DatabaseKit.Database': 'db' } }, errors: ['name'] },
    { name: 'a name outside the allowed ones', code: 'function* run() { const users = yield* AuthKit.Auth }', options: { allow: '^kit' }, errors: ['name'] },
  ])('$name', (row) => testerRun(effectYieldName, row))
})
