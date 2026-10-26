import { astSelectorRule } from '../../utils/ast.utils.ts'

export const reactDynamicClasses = astSelectorRule(
  ':matches(JSXAttribute[name.name="className"] TemplateLiteral[expressions.length>0], JSXAttribute[name.name="className"] BinaryExpression[operator="+"])',
  'Write complete class names instead of constructing them dynamically.',
)
