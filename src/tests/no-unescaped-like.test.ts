import { test } from 'vitest'
import { noUnescapedLike } from '../rules/no-unescaped-like.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ methods: ['like', 'ilike'], sanitizers: ['escapeLikeWildcards'], allowSanitizedBindings: true }]
const error = { messageId: 'unescaped' }

test('no-unescaped-like', () => {
  createRuleTester().run('arch/no-unescaped-like', noUnescapedLike, {
    valid: [
      { code: 'query.like(column, escapeLikeWildcards(term))', options },
      { code: 'const escaped = escapeLikeWildcards(term)\nquery.ilike(column, escaped)', options },
      { code: 'query.equals(column, term)', options },
    ],
    invalid: [
      { code: ['query.ilike(column, `%$', '{term}%`)'].join(''), options, errors: [error] },
      { code: 'const pattern = term\nquery.like(column, pattern)', options, errors: [error] },
    ],
  })
})
