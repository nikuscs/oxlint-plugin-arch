import { describe, it } from 'vitest'
import { backendSqlLike } from '../../../src/rules/backend/backend-sql-like.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/backend-sql-like', () => {
  it.each([
    { name: 'direct sanitizer call', code: 'query.like(column, escapeLike(term))', options: { methods: ['like'], sanitizers: ['escapeLike'] } },
    { name: 'unrelated methods pass', code: 'query.equals(column, term)', options: { methods: ['like'], sanitizers: ['escapeLike'] } },
    {
      name: 'template dynamic parts are sanitized',
      code: `query.ilike(
  column,
  \`%\${escapeLike(term)}%\`
)`,
      options: { methods: ['ilike'], sanitizers: ['escapeLike'] },
    },
    {
      name: 'concatenation surrounds sanitized input',
      code: "query.like(column, '%' + escapeLike(term) + '%')",
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
    },
    {
      name: 'both conditional branches are sanitized',
      code: 'query.like(column, flag ? escapeLike(first) : escapeLike(second))',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
    },
    {
      name: 'literal fallback is safe beside sanitized input',
      code: "query.like(column, escapeLike(term) || '%')",
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
    },
    {
      name: 'top-level binding is trusted by default',
      code: 'const escaped = escapeLike(term)\nquery.like(column, escaped)',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
    },
    {
      name: 'zero-argument transforms preserve sanitization',
      code: 'query.like(column, escapeLike(term).toLowerCase())',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
    },
    {
      name: 'operator-style queries use their final argument',
      code: "query.where('title', 'ilike', escapeLike(term))",
      options: { methods: ['ilike'], sanitizers: ['escapeLike'], operators: ['where'] },
    },
    {
      name: 'an inline sanitizer passes',
      code: 'query.like(column, escapeLikeWildcards(term))',
      options: { methods: ['like', 'ilike'], sanitizers: ['escapeLikeWildcards'], bindings: true },
    },
    {
      name: 'a sanitized binding passes',
      code: 'const escaped = escapeLikeWildcards(term)\nquery.ilike(column, escaped)',
      options: { methods: ['like', 'ilike'], sanitizers: ['escapeLikeWildcards'], bindings: true },
    },
    { name: 'raw search value', code: 'query.like(column, term)', options: { methods: ['like'], sanitizers: ['escapeLike'] }, errors: ['unescaped'] },
    {
      name: 'one unsafe template part rejects the value',
      code: `query.like(
  column,
  \`\${escapeLike(first)}\${second}\`
)`,
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
      errors: ['unescaped'],
    },
    {
      name: 'bindings can be disabled',
      code: 'const escaped = escapeLike(term)\nquery.like(column, escaped)',
      options: { methods: ['like'], sanitizers: ['escapeLike'], bindings: false },
      errors: ['unescaped'],
    },
    {
      name: 'reassigned bindings are not trusted',
      code: 'let escaped = escapeLike(term)\nescaped = term\nquery.like(column, escaped)',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
      errors: ['unescaped'],
    },
    {
      name: 'function-local bindings are not trusted',
      code: 'function search() { const escaped = escapeLike(term); query.like(column, escaped) }',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
      errors: ['unescaped'],
    },
    {
      name: 'unsafe operator-style query',
      code: `query.where(
  'title',
  'ilike',
  \`%\${term}%\`
)`,
      options: { methods: ['ilike'], sanitizers: ['escapeLike'], operators: ['where'] },
      errors: ['unescaped'],
    },
    {
      name: 'unlisted sanitizer does not count',
      code: 'query.like(column, clean(term))',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
      errors: ['unescaped'],
    },
    {
      name: 'cyclic aliases terminate without trusting the value',
      code: 'const first = second; const second = first; query.like(column, first)',
      options: { methods: ['like'], sanitizers: ['escapeLike'] },
      errors: ['unescaped'],
    },
    {
      name: 'an unsanitized template pattern',
      code: `query.ilike(column, \`%\${term}%\`)
`,
      options: { methods: ['like', 'ilike'], sanitizers: ['escapeLikeWildcards'], bindings: true },
      errors: ['unescaped'],
    },
    {
      name: 'a binding to a raw term',
      code: 'const pattern = term\nquery.like(column, pattern)',
      options: { methods: ['like', 'ilike'], sanitizers: ['escapeLikeWildcards'], bindings: true },
      errors: ['unescaped'],
    },
  ])('$name', (row) => testerRun(backendSqlLike, row))
})
