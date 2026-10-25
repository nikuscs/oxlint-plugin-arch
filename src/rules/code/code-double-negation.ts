import { astSelectorRule } from '../../utils/ast.utils.ts'

export const codeDoubleNegation = astSelectorRule(
  'UnaryExpression[operator="!"] > UnaryExpression[operator="!"]',
  'Use Boolean(value) or an explicit comparison.',
)
