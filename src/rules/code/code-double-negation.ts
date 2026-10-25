import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const codeDoubleNegation = syntaxRule(
  'UnaryExpression[operator="!"] > UnaryExpression[operator="!"]',
      'Use Boolean(value) or an explicit comparison.',
)
