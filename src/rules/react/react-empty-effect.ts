import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const reactEmptyEffect = syntaxRule(
  ':matches(CallExpression[callee.name=/^use(Layout)?Effect$/], CallExpression[callee.object.name="React"][callee.property.name=/^use(Layout)?Effect$/]) > :matches(ArrowFunctionExpression, FunctionExpression) > BlockStatement[body.length=0]',
      'Remove the empty effect.',
)
