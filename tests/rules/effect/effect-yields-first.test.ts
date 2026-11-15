import { describe, it } from 'vitest'
import { effectYieldsFirst } from '../../../src/rules/effect/effect-yields-first.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-yields-first', () => {
  it.each([
    { name: 'dependencies at the top', code: 'const run = Effect.fn("a")(function* () { const db = yield* Kit.Database; const users = yield* Users.Users; const rows = yield* db.query(); return rows })' },
    { name: 'a destructured dependency counts', code: 'const run = Effect.fn("a")(function* () { const { id } = yield* Kit.Organization; const users = yield* Users.Users; return id })' },
    { name: 'a yielded value later is not a dependency', code: 'const run = Effect.fn("a")(function* () { const users = yield* Users.Users; const now = yield* DateTime.now; const row = yield* users.get(); return now })' },
    { name: 'a nested generator starts its own list', code: 'const run = Effect.fn("a")(function* () { const a = yield* A.A; return yield* Effect.gen(function* () { const b = yield* B.B; return b }) })' },
    { name: 'a plain function is skipped', code: 'function run() { work(); const a = load(A.A) }' },
    {
      name: 'a dependency after a guard',
      code: 'const run = Effect.fn("a")(function* (input) { const db = yield* Kit.Database; if (!input) { return } const users = yield* Users.Users; return users })',
      errors: ['Yield Users.Users with the other dependencies, at the top of the function.'],
    },
    { name: 'a dependency after a read', code: 'const run = Effect.fn("a")(function* () { const db = yield* Kit.Database; const rows = yield* db.query(); const users = yield* Users.Users; return rows })', errors: ['first'] },
    { name: 'one report per late dependency', code: 'const run = Effect.fn("a")(function* () { work(); const a = yield* A.A; const b = yield* B.B })', errors: ['first', 'first'] },
  ])('$name', (row) => testerRun(effectYieldsFirst, row))
})
