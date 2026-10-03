import { test } from 'vitest'
import { noUnescapedLike } from '../rules/no-unescaped-like.ts'
import { paddingBetweenStatements } from '../rules/padding-between-statements.ts'
import { createRuleTester } from './rule-tester.ts'

const paddingOptions = [{ multilineVariables: true }]
const likeOptions = [{ methods: ['like', 'ilike'], sanitizers: ['escapeLike'], operatorMethods: ['where'] }]

test('multiline declaration padding handles exports without changing legacy defaults', () => {
  createRuleTester().run('arch/padding-between-statements', paddingBetweenStatements, {
    valid: [
      'export const first = {\n  value: 1,\n}\nexport const second = 2',
      { code: 'export const first = {\n  value: 1,\n}\n\nexport const second = 2', options: paddingOptions },
      { code: 'const first = 1\nconst second = 2', options: paddingOptions },
    ],
    invalid: [
      {
        code: 'export const first = {\n  value: 1,\n}\nexport const second = 2',
        output: 'export const first = {\n  value: 1,\n}\n\nexport const second = 2',
        options: paddingOptions,
        errors: [{ messageId: 'multilineVariable' }],
      },
      {
        code: 'const first = 1\nconst second = {\n  value: 2,\n}',
        output: 'const first = 1\n\nconst second = {\n  value: 2,\n}',
        options: paddingOptions,
        errors: [{ messageId: 'multilineVariable' }],
      },
      {
        code: 'const first = {\n  value: 1,\n}\n// Preserve this comment.\nconst second = 2',
        output: 'const first = {\n  value: 1,\n}\n\n// Preserve this comment.\nconst second = 2',
        options: paddingOptions,
        errors: [{ messageId: 'multilineVariable' }],
      },
      {
        code: 'const first = {\n  value: 1,\n}; // oxlint-disable-next-line no-console\nconsole.log(first)',
        output: null,
        options: paddingOptions,
        errors: [{ messageId: 'multilineVariable' }],
      },
    ],
  })
})

test('LIKE operator methods require sanitizers only for configured operators', () => {
  createRuleTester().run('arch/no-unescaped-like', noUnescapedLike, {
    valid: [
      { code: "query.where('name', 'like', escapeLike(term))", options: likeOptions },
      { code: "const escaped = escapeLike(term); query.where('name', 'ilike', escaped)", options: likeOptions },
      { code: "query.where('name', '=', term)", options: likeOptions },
      { code: "query.other('name', 'like', term)", options: likeOptions },
      { code: "query.where('name', 'like', term)", options: [{ methods: ['like'], sanitizers: ['escapeLike'] }] },
    ],
    invalid: [
      { code: "query.where('name', 'like', term)", options: likeOptions, errors: [{ messageId: 'unescaped' }] },
      { code: "query.where('name', 'ilike', term)", options: likeOptions, errors: [{ messageId: 'unescaped' }] },
      { code: "query.like('name', term)", options: likeOptions, errors: [{ messageId: 'unescaped' }] },
    ],
  })
})
