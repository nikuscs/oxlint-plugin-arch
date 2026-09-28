import { test } from 'vitest'
import { testTitlePattern } from '../rules/test-title-pattern.ts'
import { createRuleTester } from './rule-tester.ts'

const forbidden = { messageId: 'forbidden' }
const required = { messageId: 'required' }

test('test-title-pattern', () => {
  createRuleTester().run(
    'arch/test-title-pattern',
    testTitlePattern,
    {
      valid: [
        "test('should save', fn)",
        {
          code: "test('saves a record', fn); it.skip('loads a record', fn); describe.only('records', fn)",
          options: [{ callees: ['describe', 'it', 'test'], forbid: '^should ', flags: '' }],
        },
        {
          code: "test('SAVES A RECORD', fn)",
          options: [{ callees: ['test'], require: '^saves', flags: 'i' }],
        },
        {
          code: "spec('works', fn); test('ignored', fn)",
          options: [{ callees: ['spec'], require: '^works$', flags: '' }],
        },
        {
          code: "test.each(cases)('saves %s', fn)",
          options: [{ callees: ['test'], require: '^saves', flags: '' }],
        },
        {
          code: 'test(title, fn); test(42, fn)',
          options: [{ callees: ['test'], require: '^named', flags: '' }],
        },
        {
          code: 'test(`loads ${count} records`, fn)',
          options: [{ callees: ['test'], forbid: '^should', flags: '' }],
        },
        {
          // Why: interpolated titles are not checked; the old invalid case treated `loads  items` as the title.
          code: 'test(`loads ${count} items`, fn)',
          options: [{ callees: ['test'], forbid: '^loads\\s+items$', flags: '' }],
        },
        {
          code: "test.fails('should be ignored', fn)",
          options: [{ callees: ['test'], forbid: '^should', flags: '' }],
        },
        {
          code: "test.each`a | b`('saves a record', fn)",
          options: [{ callees: ['test'], forbid: '^should', flags: '' }],
        },
      ],
      invalid: [
        {
          code: "test('should save', fn)",
          options: [{ forbid: '^should ' }],
          errors: [forbidden],
        },
        {
          code: "it.only('should load', fn); test.skip('should skip', fn); test.concurrent('should race', fn); test.todo('should add')",
          options: [{ callees: ['describe', 'it', 'test'], forbid: '^should ', flags: '' }],
          errors: [forbidden, forbidden, forbidden, forbidden],
        },
        {
          code: "test.concurrent.only('wrong', fn)",
          options: [{ callees: ['test'], require: '^right$', flags: '' }],
          errors: [required],
        },
        {
          code: "test.each(cases)('should save %s', fn)",
          options: [{ callees: ['test'], forbid: '^should ', flags: '' }],
          errors: [forbidden],
        },
        {
          code: "test.skip.each(cases)('should save', fn); test.concurrent.each(cases)('should load', fn); test.only.each(cases)('should save %s', fn)",
          options: [{ callees: ['test'], forbid: '^should', flags: '' }],
          errors: [forbidden, forbidden, forbidden],
        },
        {
          code: "test.each`a | b\n${1} | ${2}`('should add', fn)",
          options: [{ callees: ['test'], forbid: '^should', flags: '' }],
          errors: [forbidden],
        },
        {
          code: 'test(`should save`, fn)',
          options: [{ callees: ['test'], forbid: '^should ', flags: '' }],
          errors: [forbidden],
        },
        {
          code: "spec('does not match', fn)",
          options: [{ callees: ['spec'], require: '^works$', flags: '' }],
          errors: [required],
        },
        {
          code: "describe('SHOULD SAVE', fn)",
          options: [{ callees: ['describe', 'it', 'test'], forbid: '^should', flags: 'i' }],
          errors: [forbidden],
        },
        {
          code: "test('bad title', fn)",
          options: [{ callees: ['test'], forbid: '^bad', require: '^good', flags: '' }],
          errors: [forbidden, required],
        },
      ],
    },
  )
})
