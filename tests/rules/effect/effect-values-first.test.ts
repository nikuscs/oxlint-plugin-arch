import { describe, it } from 'vitest'
import { effectValuesFirst } from '../../../src/rules/effect/effect-values-first.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-values-first', () => {
  it.each([
    { name: 'values before helpers pass', code: 'const max = 3\nconst limit = (n) => Math.min(n, max)' },
    { name: 'a value that uses a helper passes', code: 'const double = (n) => n * 2\nconst four = double(2)' },
    { name: 'a value that uses a value built from a helper passes', code: 'const double = (n) => n * 2\nconst four = double(2)\nconst eight = four * 2' },
    { name: 'a layer after a helper passes', code: 'const make = Effect.gen(function* () {})\nconst layer = Layer.effect(Users, make)' },
    { name: 'a service after a helper passes', code: 'const get = (id) => id\nconst service = Users.of({ id: 1 })' },
    { name: 'a decoder after a helper passes', code: 'const get = (id) => id\nconst decode = Schema.decodeUnknownSync(User)' },
    { name: 'a piped layer reference passes', code: 'const get = (id) => id\nconst live = layerUsers.pipe(Layer.provide(Db))' },
    { name: 'a statement that runs a helper fixes the order after it', code: 'const setup = () => {}\nsetup()\nconst max = 3' },
    {
      name: 'a value after a pinned step that yields passes',
      code: 'const make = Effect.gen(function* () {\n  const get = (id) => id\n  const user = yield* get(1)\n  const max = 3\n})',
    },
    { name: 'a pattern left out of pinned no longer passes', code: 'const get = (id) => id\nconst service = Users.of({ id: 1 })', options: { pinned: ['^Layer\\.'] }, errors: ['value'] },
    { name: 'a value after an arrow', code: 'const limit = (n) => n\nconst max = 3', errors: ['value'] },
    { name: 'the message names the value and the helper', code: 'const limit = (n) => n\nconst max = 3', errors: ['`max` is a value declared after `limit`: declare values first, then helpers and methods.'] },
    { name: 'a value after an Effect.fn', code: "const run = Effect.fn('run')(function* () {})\nconst max = 3", errors: ['value'] },
    { name: 'a value after a function declaration', code: 'function limit(n) { return n }\nconst max = 3', errors: ['value'] },
    { name: 'an exported value after a helper', code: 'const limit = (n) => n\nexport const max = 3', errors: ['value'] },
    { name: 'a value inside make after a helper', code: 'const make = Effect.gen(function* () {\n  const get = (id) => id\n  const max = 3\n})', errors: ['value'] },
    { name: 'a value inside a top-level arrow after a helper', code: 'const build = () => {\n  const get = (id) => id\n  const max = 3\n}', errors: ['value'] },
    { name: 'a custom builder is a helper', code: 'const run = Task.make(() => 1)\nconst max = 3', options: { builders: ['Task.make'] }, errors: ['value'] },
    { name: 'builders replace the defaults', code: 'const run = Effect.gen(function* () {})\nconst max = 3', options: { builders: ['Task.make'] } },
  ])('$name', (row) => testerRun(effectValuesFirst, row))
})
