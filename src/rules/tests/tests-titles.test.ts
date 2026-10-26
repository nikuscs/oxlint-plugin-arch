import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { testsTitles } from './tests-titles.ts'

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
    {
      name: 'a set of allowed test and suite titles passes',
      code: "test('saves a record', fn); it.skip('loads a record', fn); describe.only('records', fn)",
      options: { callees: ['describe', 'it', 'test'], deny: '^should ', flags: '' },
    },
    {
      name: 'an each title matching the required prefix passes',
      code: "test.each(cases)('saves %s', fn)",
      options: { callees: ['test'], require: '^saves', flags: '' },
    },
    {
      name: 'an interpolated record title passes',
      code: `test(\`loads \${count} records\`, fn)
`,
      options: { callees: ['test'], deny: '^should', flags: '' },
    },
    {
      name: 'an interpolated title matching static fragments passes',
      code: `test(\`loads \${count} items\`, fn)
`,
      options: { callees: ['test'], deny: '^loads\\s+items$', flags: '' },
    },
    {
      name: 'a forbidden title on an unlisted modifier passes',
      code: "test.fails('should be ignored', fn)",
      options: { callees: ['test'], deny: '^should', flags: '' },
    },
    { name: 'an allowed tagged each title passes', code: "test.each`a | b`('saves a record', fn)", options: { callees: ['test'], deny: '^should', flags: '' } },
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
      name: 'forbidden titles on modified each calls',
      code: "test.skip.each(cases)('should save', fn); test.concurrent.each(cases)('should load', fn); test.only.each(cases)('should save %s', fn)",
      options: { callees: ['test'], deny: '^should', flags: '' },
      errors: ['forbidden', 'forbidden', 'forbidden'],
    },
    {
      name: 'a forbidden title on a multiline tagged table',
      code: `test.each\`a | b
\${1} | \${2}\`('should add', fn)`,
      options: { callees: ['test'], deny: '^should', flags: '' },
      errors: ['forbidden'],
    },
    {
      name: 'a custom callee title missing the required pattern',
      code: "spec('does not match', fn)",
      options: { callees: ['spec'], require: '^works$', flags: '' },
      errors: ['required'],
    },
  ])('$name', (row) => testerRun(testsTitles, row))
})
