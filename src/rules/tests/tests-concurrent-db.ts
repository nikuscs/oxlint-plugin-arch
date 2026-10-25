import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const testsConcurrentDb = syntaxRule(
  'CallExpression[callee.object.name="test"][callee.property.name="concurrent"] ObjectPattern > Property[key.name="db"]',
      'Obtain an isolated database fixture for concurrent tests.',
)
