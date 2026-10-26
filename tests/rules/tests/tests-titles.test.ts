import { describe, it } from 'vitest'
import { testsTitles } from '../../../src/rules/tests/tests-titles.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/tests-titles', () => {
  it.each([
    { name: 'does nothing without deny or require', code: "test('should save', fn)" },
    { name: 'a title clear of deny passes', code: "test('saves a record', fn)", options: { deny: '^should ' } },
    { name: 'flags apply to require', code: "test('SAVES A RECORD', fn)", options: { require: '^saves', flags: 'i' } },
    { name: 'any require pattern passes', code: "test('loads a record', fn)", options: { require: ['^saves', '^loads'] } },
    { name: 'only listed callees are checked', code: "spec('works', fn); test('ignored', fn)", options: { callees: ['spec'], require: '^works$' } },
    { name: 'dynamic titles are skipped', code: 'test(title, fn); test(42, fn)', options: { require: '^saves' } },
    {
      name: 'interpolated templates are skipped',
      code: `const count = 2
test(\`loads \${count} items\`, fn)`,
      options: { deny: '^loads' },
    },
    { name: 'unlisted modifiers are skipped', code: "test.fails('should save', fn)", options: { deny: '^should' } },
    { name: 'an allowed tagged each title passes', code: "test.each`a | b`('saves a record', fn)", options: { deny: '^should' } },
    { name: 'deny', code: "test('should save', fn)", options: { deny: '^should ' }, errors: ['forbidden'] },
    { name: 'any deny pattern', code: "test('should save', fn)", options: { deny: ['^bad', '^should'] }, errors: ['forbidden'] },
    { name: 'require', code: "test('works', fn)", options: { require: '^saves' }, errors: ['required'] },
    { name: 'flags apply to deny', code: "describe('SHOULD SAVE', fn)", options: { deny: '^should', flags: 'i' }, errors: ['forbidden'] },
    { name: 'deny and require both report', code: "test('bad title', fn)", options: { deny: '^bad', require: '^good' }, errors: ['forbidden', 'required'] },
    { name: 'a static template', code: 'test(`should save`, fn)', options: { deny: '^should' }, errors: ['forbidden'] },
    { name: 'a chained modifier', code: "test.concurrent.only('wrong', fn)", options: { require: '^right$' }, errors: ['required'] },
    { name: 'an each table title', code: "test.each(cases)('should save %s', fn)", options: { deny: '^should' }, errors: ['forbidden'] },
    { name: 'a tagged each title', code: "test.each`a | b`('should add', fn)", options: { deny: '^should' }, errors: ['forbidden'] },
    {
      name: 'modifier calls',
      code: "it.only('should load', fn); test.skip('should skip', fn); test.concurrent('should race', fn); test.todo('should add')",
      options: { deny: '^should' },
      errors: ['forbidden', 'forbidden', 'forbidden', 'forbidden'],
    },
    {
      name: 'custom callees',
      code: "test.for(cases)('should save %s', fn); integrationTest.for(cases)('should load %s', fn)",
      options: { callees: ['test', 'integrationTest'], deny: '^should' },
      errors: ['forbidden', 'forbidden'],
    },
    {
      name: 'a custom callee title missing the required pattern',
      code: "spec('does not match', fn)",
      options: { callees: ['spec'], require: '^works$' },
      errors: ['required'],
    },
  ])('$name', (row) => testerRun(testsTitles, row))
})
