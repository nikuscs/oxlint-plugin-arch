import { astSelectorRule } from '../../utils/ast.utils.ts'

export const testsConcurrentDb = astSelectorRule(
  'CallExpression[callee.object.name="test"][callee.property.name="concurrent"] ObjectPattern > Property[key.name="db"]',
  'Obtain an isolated database fixture for concurrent tests.',
)
