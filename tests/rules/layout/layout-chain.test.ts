import { describe, it } from 'vitest'
import { layoutChain } from '../../../src/rules/layout/layout-chain.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-chain', () => {
  it.each([
    { name: 'a short chain stays inline', code: 'items.filter(active).map(toName)', options: { groups: [{ min: 3 }] } },
    { name: 'already split chain passes', code: 'items\n  .filter(active)\n  .map(toName)\n  .sort()', options: { groups: [{ min: 3 }] } },
    { name: 'a computed link skips the chain', code: 'items.filter(active)[method]().sort()', options: { groups: [{ min: 3 }] } },
    { name: 'a comment line between links passes', code: 'items\n  .filter(active)\n  // keep\n  .map(toName)\n  .sort()', options: { groups: [{ min: 3 }] } },
    { name: 'a trailing comment on a link passes', code: 'items\n  .filter(active) // keep\n  .map(toName)\n  .sort()', options: { groups: [{ min: 3 }] } },
    { name: 'methods needs one listed call', code: 'db.select().from(users).where(active)', options: { groups: [{ min: 3, methods: ['execute'] }] } },
    { name: 'only needs every call listed', code: 'service.input(schema).other(run)', options: { groups: [{ min: 2, only: ['input', 'handler'] }] } },
    { name: 'root must match the pattern', code: 'service.input(schema).handler(run)', options: { groups: [{ min: 2, root: 'Procedure$' }] } },
    { name: 'a split parenthesized chain passes', code: '(items ?? [])\n  .filter(active)\n  .map(toName)\n  .sort()', options: { groups: [{ min: 3 }] } },
    { name: 'an empty groups list disables the rule', code: 'items.filter(active).map(toName).sort()', options: { groups: [] } },
    {
      name: 'a comment between links blocks the fix',
      code: 'items.filter(active) /* keep */.map(toName).sort()',
      options: { groups: [{ min: 3 }] },
      output: null,
      errors: ['newline'],
    },
    {
      name: 'splits a chain',
      code: 'const rows = await db.select().from(users).where(active)',
      options: { groups: [{ min: 3 }] },
      output: 'const rows = await db\n  .select()\n  .from(users)\n  .where(active)',
      errors: ['newline'],
    },
    {
      name: 'methods matches any listed call',
      code: 'db.selectFrom("users").where("active", "=", true).execute()',
      options: { groups: [{ min: 3, methods: ['execute'] }] },
      output: 'db\n  .selectFrom("users")\n  .where("active", "=", true)\n  .execute()',
      errors: ['newline'],
    },
    {
      name: 'only matches when every call is listed',
      code: 'service.input(schema).use(auth).handler(run)',
      options: { groups: [{ min: 2, only: ['input', 'use', 'handler'] }] },
      output: 'service\n  .input(schema)\n  .use(auth)\n  .handler(run)',
      errors: ['newline'],
    },
    {
      name: 'root matches any listed pattern',
      code: 'jobProcedure.input(schema).handler(run)',
      options: { groups: [{ min: 2, root: ['^never$', 'Procedure$'] }] },
      output: 'jobProcedure\n  .input(schema)\n  .handler(run)',
      errors: ['newline'],
    },
    {
      name: 'keeps optional chaining',
      code: 'items?.filter(active).map(toName).sort()',
      options: { groups: [{ min: 3 }] },
      output: 'items\n  ?.filter(active)\n  .map(toName)\n  .sort()',
      errors: ['newline'],
    },
    {
      name: 'splits a chain inside a call',
      code: 'wrap(items.filter(active).map(toName).sort())',
      options: { groups: [{ min: 3 }] },
      output: 'wrap(items\n  .filter(active)\n  .map(toName)\n  .sort())',
      errors: ['newline'],
    },
    {
      name: 'splits after a parenthesized root',
      code: 'await (db as TestDb).insertInto("users").values(row).execute()',
      options: { groups: [{ min: 3 }] },
      output: 'await (db as TestDb)\n  .insertInto("users")\n  .values(row)\n  .execute()',
      errors: ['newline'],
    },
    {
      name: 'splits after a multiline root',
      code: 'const names = (\n  items ??\n  []\n).filter(active).map(toName).sort()',
      options: { groups: [{ min: 3 }] },
      output: 'const names = (\n  items ??\n  []\n)\n  .filter(active)\n  .map(toName)\n  .sort()',
      errors: ['newline'],
    },
    {
      name: 'tab indent',
      code: 'items.filter(active).map(toName).sort()',
      options: { groups: [{ min: 3 }], indent: 'tab' },
      output: 'items\n\t.filter(active)\n\t.map(toName)\n\t.sort()',
      errors: ['newline'],
    },
  ])('$name', (row) => testerRun(layoutChain, row))
})
